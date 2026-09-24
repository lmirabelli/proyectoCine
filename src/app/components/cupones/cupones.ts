import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';

export interface Cupon {
  id: string;
  codigo: string;
  descuento: number;
  disponible: number;
  fecha_creacion?: string;
}

export interface DescuentoRegla {
  id: string;
  nombre: string;
  edad_minima: number;
  porcentaje: number;
  tope_maximo: number;
}

@Component({
  selector: 'app-cupones',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cupones.html',
  styleUrls: ['./cupones.css']
})
export class CuponesComponent implements OnInit {
  private supabaseService = inject(SupabaseService);

  esAdmin = signal<boolean>(false);

  // Estados para Cupones
  cupones = signal<Cupon[]>([]);
  codigoCupon: string = '';
  descuentoCupon: number = 10;
  cuponesDisponibles: number = 100; // Configurable desde el form

  // Estados para Descuentos por Edad
  descuentos = signal<DescuentoRegla[]>([]);
  nombreDescuento: string = 'Jubilados / +65';
  edadMinima: number = 65;
  porcentajeDescuentoEdad: number = 10;
  topeMaximo: number = 5000;

  ngOnInit(): void {
    this.verificarAdmin();
  }

  async verificarAdmin(): Promise<void> {
    const status = await this.supabaseService.esAdministrador();
    this.esAdmin.set(status);

    if (this.esAdmin()) {
      this.cargarTodo();
    }
  }

  async cargarTodo(): Promise<void> {
    await Promise.all([this.cargarCupones(), this.cargarDescuentos()]);
  }

  // --- CUPONES ---
  async cargarCupones(): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('cupones')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      this.cupones.set(data || []);
    } catch (error) {
      console.error('Error al cargar cupones:', error);
    }
  }

  async guardarCupon(): Promise<void> {
    if (!this.esAdmin()) return;

    if (!this.codigoCupon.trim() || this.descuentoCupon <= 0 || this.cuponesDisponibles <= 0) {
      alert('Ingresá valores válidos para crear el cupón.');
      return;
    }

    try {
      const { error } = await this.supabaseService.client
        .from('cupones')
        .insert([{
          codigo: this.codigoCupon.trim().toUpperCase(),
          descuento: this.descuentoCupon,
          disponible: this.cuponesDisponibles
        }]);

      if (error) throw error;

      // Reset del formulario
      this.codigoCupon = '';
      this.descuentoCupon = 10;
      this.cuponesDisponibles = 100;

      await this.cargarCupones();
    } catch (error) {
      console.error('Error al crear el cupón:', error);
      alert('Error al crear el cupón. Es posible que el código ya exista.');
    }
  }

  async borrarCupon(id: string): Promise<void> {
    if (!confirm('¿Deseas eliminar este cupón promocional?')) return;

    try {
      const { error } = await this.supabaseService.client
        .from('cupones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await this.cargarCupones();
    } catch (error) {
      console.error('Error al borrar el cupón:', error);
    }
  }

  // --- REGLAS DE EDAD ---
  async cargarDescuentos(): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('descuentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.descuentos.set(data || []);
    } catch (error) {
      console.error('Error al cargar descuentos:', error);
    }
  }

  async guardarDescuentoEdad(): Promise<void> {
    if (!this.esAdmin()) return;

    if (!this.nombreDescuento.trim() || this.edadMinima <= 0 || this.porcentajeDescuentoEdad <= 0 || this.topeMaximo <= 0) {
      alert('Ingresá valores válidos para configurar la regla.');
      return;
    }

    try {
      const { error } = await this.supabaseService.client
        .from('descuentos')
        .insert([{
          nombre: this.nombreDescuento.trim(),
          edad_minima: this.edadMinima,
          porcentaje: this.porcentajeDescuentoEdad,
          tope_maximo: this.topeMaximo
        }]);

      if (error) throw error;

      this.nombreDescuento = '';
      this.edadMinima = 65;
      this.porcentajeDescuentoEdad = 10;
      this.topeMaximo = 5000;

      await this.cargarDescuentos();
    } catch (error) {
      console.error('Error al crear el descuento:', error);
    }
  }

  async borrarDescuento(id: string): Promise<void> {
    if (!confirm('¿Deseas eliminar esta regla de descuento?')) return;

    try {
      const { error } = await this.supabaseService.client
        .from('descuentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await this.cargarDescuentos();
    } catch (error) {
      console.error('Error al borrar regla de descuento:', error);
    }
  }
}