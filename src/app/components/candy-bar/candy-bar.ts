import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';

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

@Component({
  selector: 'app-candy-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candy-bar.html',
  styleUrl: './candy-bar.css'
})
export class CandyBarComponent implements OnInit {
  private supabase = inject(SupabaseService);

  productos = signal<ProductoCandy[]>([]);
  categoriaSeleccionada = signal<string>('Todas');
  cargando = signal<boolean>(true);
  procesando = signal<boolean>(false);
  mensajeExito = signal<string | null>(null);

  carrito = signal<ItemCarrito[]>([]);

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

  totalCarrito = computed(() => {
    return this.carrito().reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
  });

  async ngOnInit(): Promise<void> {
    await this.cargarProductos();
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

  async confirmarVenta(): Promise<void> {
    if (this.carrito().length === 0) return;

    this.procesando.set(true);
    this.mensajeExito.set(null);

    try {
      this.mensajeExito.set('¡Compra realizada con éxito!');
      this.vaciarCarrito();
    } catch (err) {
      console.error('Error al procesar la venta:', err);
    } finally {
      this.procesando.set(false);
    }
  }
}