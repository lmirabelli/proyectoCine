import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';
import { PdfService } from '../../services/pdf';
import { ComprobanteReserva } from '../../models/reserva';

export interface ProductoCandy {
  id: string;
  producto: string;
  tamano?: string;
  marca?: string;
  precio: number;
  categoria?: string;
}

export interface ItemCarrito {
  producto: ProductoCandy;
  cantidad: number;
}

export interface ReservaEntradasCache {
  peliculaId: string;
  tituloPelicula: string;
  funcionId: string;
  formato: string;
  idioma: string;
  cantidad: number;
  montoTotal: number;
  sala: string;
  fechaInicio: string;
  fechaReserva: string;
}

@Component({
  selector: 'app-candy-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candy-bar.html',
  styleUrl: './candy-bar.css'
})
export class CandyBarComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private pdfService = inject(PdfService);

  productos = signal<ProductoCandy[]>([]);
  categoriaSeleccionada = signal<string>('Todas');
  cargando = signal<boolean>(true);
  procesando = signal<boolean>(false);
  mensajeExito = signal<string | null>(null);
  imagenPelicula = signal<string | null>(null);

  carrito = signal<ItemCarrito[]>([]);
  
  reservaPendiente = signal<ReservaEntradasCache | null>(null);

  mostrarModalResumen = signal<boolean>(false);

  categoriasDisponibles = computed(() => {
    const cats = this.productos()
      .map(p => p.categoria || 'Otros')
      .filter((v, i, a) => a.indexOf(v) === i);
    return ['Todas', ...cats];
  });

  productosFiltrados = computed(() => {
    const cat = this.categoriaSeleccionada();
    if (cat === 'Todas') {
      return this.productos();
    }
    return this.productos().filter(p => (p.categoria || 'Otros') === cat);
  });

  subtotalCandy = computed(() => {
    return this.carrito().reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
  });

  subtotalEntradas = computed(() => {
    return this.reservaPendiente()?.montoTotal ?? 0;
  });

  totalPagar = computed(() => {
    return this.subtotalCandy() + this.subtotalEntradas();
  });

  async ngOnInit(): Promise<void> {
    this.cargarReservaPendiente();
    await this.cargarProductos();
  }

  private async cargarReservaPendiente(): Promise<void> {
  const entradasCache = localStorage.getItem('reserva_entradas_pendiente');
  if (entradasCache) {
    try {
      const datos: ReservaEntradasCache = JSON.parse(entradasCache);
      this.reservaPendiente.set(datos);

      if (datos.peliculaId) {
        const { data } = await this.supabase.client
          .from('peliculas')
          .select('afiche_url')
          .eq('id', datos.peliculaId)
          .single();

        if (data) {
          this.imagenPelicula.set(data.afiche_url);
        }
      }
    } catch (e) {
      console.error('Error al parsear o buscar la portada de la película:', e);
    }
  }
}


  cancelarReservaEntradas(): void {
    localStorage.removeItem('reserva_entradas_pendiente');
    this.reservaPendiente.set(null);
  }

  async cargarProductos(): Promise<void> {
    this.cargando.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('candy')
        .select('*')
        .order('producto', { ascending: true });

      if (error) throw error;
      if (data) {
        this.productos.set(data);
      }
    } catch (err) {
      console.error('Error al cargar productos de Candy Bar:', err);
    } finally {
      this.cargando.set(false);
    }
  }

  seleccionarCategoria(cat: string): void {
    this.categoriaSeleccionada.set(cat);
  }

  agregarAlCarrito(producto: ProductoCandy): void {
    const items = [...this.carrito()];
    const index = items.findIndex(item => item.producto.id === producto.id);

    if (index >= 0) {
      items[index].cantidad += 1;
    } else {
      items.push({ producto, cantidad: 1 });
    }

    this.carrito.set(items);
  }

  modificarCantidad(productoId: string, cambio: number): void {
    const items = this.carrito().map(item => {
      if (item.producto.id === productoId) {
        const nuevaCantidad = item.cantidad + cambio;
        return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null;
      }
      return item;
    }).filter((item): item is ItemCarrito => item !== null);

    this.carrito.set(items);
  }

  vaciarCarrito(): void {
    this.carrito.set([]);
  }

  async pagarYGenerarPdf(): Promise<void> {
    this.procesando.set(true);
    this.mensajeExito.set(null);

    try {
      const idReservaGenerado = 'COMP-' + Math.floor(100000 + Math.random() * 900000);
      const entradas = this.reservaPendiente();


      const datosComprobante: ComprobanteReserva = {
        idReserva: idReservaGenerado,
        peliculaId: entradas?.peliculaId,
        tituloPelicula: entradas?.tituloPelicula,
        formato: entradas?.formato,
        idioma: entradas?.idioma,
        sala: entradas?.sala,
        fechaInicio: entradas?.fechaInicio,
        cantidadEntradas: entradas?.cantidad,
        asientos: [],
        itemsCandy: this.carrito().map(i => ({
          nombre: i.producto.producto,
          cantidad: i.cantidad,
          precioUnitario: i.producto.precio,
          subtotal: i.producto.precio * i.cantidad
        })),
        montoTotal: this.totalPagar(),
        fechaCompra: new Date().toISOString(),
        codigoQR: idReservaGenerado
      };

      await this.pdfService.generarComprobantePDF(datosComprobante);

      const usuarioSesion = this.supabase.usuarioActual();
      if (usuarioSesion && this.reservaPendiente()) {
        const { data } = await this.supabase.client
          .from('perfiles')
          .select('compras')
          .eq('id', usuarioSesion.id)
          .single();

        const comprasPrevias = data?.compras ?? 0;

        await this.supabase.client
          .from('perfiles')
          .update({ compras: comprasPrevias + 1 })
          .eq('id', usuarioSesion.id);
      }

      localStorage.removeItem('reserva_entradas_pendiente');
      this.reservaPendiente.set(null);
      this.vaciarCarrito();
      this.mostrarModalResumen.set(false);

      this.mensajeExito.set('¡Compra efectuada exitosamente! Tu ticket PDF con el código QR ha sido descargado.');
    } catch (err) {
      console.error('Error al procesar la compra:', err);
      alert('Ocurrió un problema al procesar el pago.');
    } finally {
      this.procesando.set(false);
    }
  }
}