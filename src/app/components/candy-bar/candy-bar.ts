import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';
import { PdfService } from '../../services/pdf';
import { ComprobanteReserva, ReservaEntradasCache } from '../../models/reserva';
import { ItemCarrito, ProductoCandy } from '../../models/candy';
import { Router } from '@angular/router';

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
  private router = inject(Router);

  productos = signal<ProductoCandy[]>([]);
  categoriaSeleccionada = signal<string>('Todas');
  cargando = signal<boolean>(true);
  procesando = signal<boolean>(false);
  mensajeExito = signal<string | null>(null);
  imagenPelicula = signal<string | null>(null);

  carrito = signal<ItemCarrito[]>([]);
  reservaPendiente = signal<ReservaEntradasCache | null>(null);
  mostrarModalResumen = signal<boolean>(false);

  descuentoReglaAplicada = signal<{ nombre: string; porcentaje: number; tope_maximo: number } | null>(null);
  cuponAplicado = signal<{ id: string; codigo: string; descuento: number; disponible: number } | null>(null);
  inputCupon = signal<string>('');
  mensajeCupon = signal<string | null>(null);

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

  subtotalBruto = computed(() => {
    return this.subtotalCandy() + this.subtotalEntradas();
  });

  montoDescuentoEdad = computed(() => {
    const regla = this.descuentoReglaAplicada();
    if (!regla) return 0;

    const subtotal = this.subtotalBruto();
    const descuentoCalculado = (subtotal * regla.porcentaje) / 100;

    return Math.min(descuentoCalculado, regla.tope_maximo);
  });

  montoDescuentoCupon = computed(() => {
    const cupon = this.cuponAplicado();
    if (!cupon) return 0;

    const subtotal = this.subtotalBruto();
    return (subtotal * cupon.descuento) / 100;
  });

  totalPagar = computed(() => {
    const totalConDescuentos = this.subtotalBruto() - this.montoDescuentoEdad() - this.montoDescuentoCupon();
    return Math.max(0, totalConDescuentos);
  });

  async ngOnInit(): Promise<void> {
    this.cargarReservaPendiente();
    await this.cargarProductos();
    await this.evaluarDescuentosAutomaticos();
  }

  private calcularEdad(fechaNacimientoStr: string): number {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimientoStr);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  private async evaluarDescuentosAutomaticos(): Promise<void> {
    const usuario = this.supabase.usuarioActual();

    if (!usuario || !usuario.id) {
      this.descuentoReglaAplicada.set(null);
      return;
    }

    try {
      const { data: perfil, error } = await this.supabase.client
        .from('perfiles')
        .select('compras')
        .eq('id', usuario.id)
        .single();

      if (error || !perfil) {
        this.descuentoReglaAplicada.set(null);
        return;
      }

      const cantidadCompras = perfil.compras ?? 0;

      if (cantidadCompras === 0) {
        this.descuentoReglaAplicada.set({
          nombre: '1º Compra (20% OFF)',
          porcentaje: 20,
          tope_maximo: 5000
        });
      } else {
        this.descuentoReglaAplicada.set(null);
      }

    } catch (err) {
      console.error('Error al evaluar el descuento de primera compra:', err);
      this.descuentoReglaAplicada.set(null);
    }
  }

  async aplicarCupon(): Promise<void> {
    const codigo = this.inputCupon().trim();
    if (!codigo) return;

    this.mensajeCupon.set(null);

    try {
      const { data: cupon, error } = await this.supabase.client
        .from('cupones')
        .select('*')
        .ilike('codigo', codigo)
        .gt('disponible', 0)
        .maybeSingle();

      if (error) throw error;

      if (cupon) {
        this.cuponAplicado.set(cupon);
        this.mensajeCupon.set(`¡Cupon ${cupon.codigo} del ${cupon.descuento}% aplicado!`);
      } else {
        this.mensajeCupon.set('El codigo de cupon ingresado no es válido.');
      }
    } catch (err) {
      console.error('Error al aplicar el cupon:', err);
      this.mensajeCupon.set('Error al procesar el cupon.');
    }
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
      const usuarioSesion = this.supabase.usuarioActual();

      const detalleItems: Array<{
        nombre: string;
        cantidad: number;
        precioUnitario: number;
        tamano?: string;
        marca?: string;
      }> = [];

      if (entradas) {
        detalleItems.push({
          nombre: `Entrada: ${entradas.tituloPelicula} (${entradas.formato} - ${entradas.sala})`,
          cantidad: entradas.cantidad,
          precioUnitario: entradas.montoTotal / entradas.cantidad
        });
      }

      this.carrito().forEach(i => {
        detalleItems.push({
          nombre: i.producto.producto,
          cantidad: i.cantidad,
          precioUnitario: i.producto.precio,
          tamano: i.producto.tamano,
          marca: i.producto.marca
        });
      });

      const { error: errorComprobante } = await this.supabase.client
        .from('comprobantes')
        .insert([{
          codigo_reserva: idReservaGenerado,
          usuario_id: usuarioSesion?.id || null,
          monto_total: this.totalPagar(),
          estado: 'PENDIENTE',
          detalle_items: detalleItems
        }]);

      if (errorComprobante) {
        console.error('Error al registrar el comprobante en Supabase:', errorComprobante);
        throw new Error('No se pudo registrar la compra en la base de datos.');
      }

      if (entradas && entradas.peliculaId) {
        const { data: peliculaData } = await this.supabase.client
          .from('peliculas')
          .select('ventas_totales')
          .eq('id', entradas.peliculaId)
          .single();

        const ventasPrevias = peliculaData?.ventas_totales ?? 0;

        await this.supabase.client
          .from('peliculas')
          .update({ ventas_totales: ventasPrevias + entradas.cantidad })
          .eq('id', entradas.peliculaId);
      }

      const fechaHorario = entradas?.fechaInicio
        ? new Date(entradas.fechaInicio).toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '';

      const datosComprobante: ComprobanteReserva = {
        idReserva: idReservaGenerado,
        peliculaId: entradas?.peliculaId,
        tituloPelicula: entradas?.tituloPelicula,
        formato: entradas?.formato,
        idioma: entradas?.idioma,
        sala: fechaHorario ? `${entradas?.sala} - ${fechaHorario}` : entradas?.sala,
        fechaInicio: entradas?.fechaInicio,
        cantidadEntradas: entradas?.cantidad ?? 0,
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

      const cupon = this.cuponAplicado();
      if (cupon) {
        await this.supabase.client
          .from('cupones')
          .update({ disponible: cupon.disponible - 1 })
          .eq('id', cupon.id);
      }

      if (usuarioSesion && entradas) {
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
      this.cuponAplicado.set(null);
      this.inputCupon.set('');
      this.mostrarModalResumen.set(false);

      this.mensajeExito.set('¡Compra efectuada exitosamente! Tu ticket PDF con el código QR ha sido descargado.');

      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1500);

    } catch (err) {
      console.error('Error al procesar la compra:', err);
      alert('Ocurrió un problema al procesar el pago.');
    } finally {
      this.procesando.set(false);
    }
  }
}