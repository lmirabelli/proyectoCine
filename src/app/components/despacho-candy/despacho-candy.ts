import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { SupabaseService } from '../../services/supabase';
import { Comprobante } from '../../models/reserva';



@Component({
  selector: 'app-despacho-candy',
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule],
  templateUrl: './despacho-candy.html',
  styleUrls: ['./despacho-candy.css']
})
export class DespachoCandyComponent {
  private supabase = inject(SupabaseService);

  codigoInput = signal<string>('');
  comprobanteActual = signal<Comprobante | null>(null);
  cargando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);
  escaneoActivo = signal<boolean>(false);

  async buscarComprobante(codigoABuscar?: string): Promise<void> {
    const codigo = (codigoABuscar || this.codigoInput()).trim().toUpperCase();
    
    if (!codigo) return;

    this.limpiarMensajes();
    this.cargando.set(true);

    try {
      const { data, error } = await this.supabase.client
        .from('comprobantes')
        .select('*')
        .eq('codigo_reserva', codigo)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        this.mensajeError.set(`No se encontró ningún comprobante con el código: ${codigo}`);
        this.comprobanteActual.set(null);
      } else {
        this.comprobanteActual.set(data as Comprobante);
      }
    } catch (err) {
      console.error('Error al consultar comprobante:', err);
      this.mensajeError.set('Ocurrió un error al consultar la base de datos.');
    } finally {
      this.cargando.set(false);
    }
  }
  alEscanearQR(codigoRespuesta: string): void {
    if (codigoRespuesta && !this.cargando()) {
      this.codigoInput.set(codigoRespuesta);
      this.escaneoActivo.set(false);
      this.buscarComprobante(codigoRespuesta);
    }
  }

  async marcarComoEntregado(): Promise<void> {
    const comp = this.comprobanteActual();
    if (!comp) return;

    if (comp.estado === 'ENTREGADO') {
      alert('Este comprobante ya fue despachado previamente.');
      return;
    }

    this.cargando.set(true);

    try {
      const { error } = await this.supabase.client
        .from('comprobantes')
        .update({
          estado: 'ENTREGADO',
          fecha_canje: new Date().toISOString()
        })
        .eq('id', comp.id);

      if (error) throw error;

      this.mensajeExito.set(`¡Comprobante ${comp.codigo_reserva} entregado con éxito!`);
      
      this.comprobanteActual.set({
        ...comp,
        estado: 'ENTREGADO',
        fecha_canje: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error al despachar:', err);
      this.mensajeError.set('No se pudo marcar como entregado.');
    } finally {
      this.cargando.set(false);
    }
  }

  toggleCamara(): void {
    this.escaneoActivo.update(val => !val);
  }

  limpiar(): void {
    this.codigoInput.set('');
    this.comprobanteActual.set(null);
    this.limpiarMensajes();
  }

  private limpiarMensajes(): void {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
  }
}