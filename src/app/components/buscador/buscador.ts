import { Component, OnInit, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';
import { Genero } from '../../models/pelicula';
import { FiltroBusqueda } from '../../models/busqueda';



@Component({
  selector: 'app-buscador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buscador.html',
  styleUrl: './buscador.css'
})
export class Buscador implements OnInit {
  private supabase = inject(SupabaseService);

  @Output() buscar = new EventEmitter<FiltroBusqueda>();

  busquedaTexto = signal<string>('');
  generos = signal<Genero[]>([]);
  generosSeleccionadosIds = signal<string[]>([]);

  async ngOnInit(): Promise<void> {
    await this.cargarGeneros();
  }

  async cargarGeneros(): Promise<void> {
    try {
      const { data, error } = await this.supabase.client
        .from('generos')
        .select('id, nombre')
        .order('nombre', { ascending: true });

      if (!error && data) {
        this.generos.set(data);
      }
    } catch (err) {
      console.error('Error al cargar géneros:', err);
    }
  }

  onGeneroChange(id: string, checked: boolean): void {
    const actuales = this.generosSeleccionadosIds();
    if (checked) {
      this.generosSeleccionadosIds.set([...actuales, id]);
    } else {
      this.generosSeleccionadosIds.set(actuales.filter(gId => gId !== id));
    }
    this.emitirFiltro();
  }

  onTextoInput(valor: string): void {
    this.busquedaTexto.set(valor);
    this.emitirFiltro();
  }

  onBuscarSubmit(): void {
    this.emitirFiltro();
  }

  limpiarBuscador(): void {
    this.busquedaTexto.set('');
    this.generosSeleccionadosIds.set([]);
    this.emitirFiltro();
  }

  private emitirFiltro(): void {
    this.buscar.emit({
      texto: this.busquedaTexto().trim(),
      generosIds: this.generosSeleccionadosIds()
    });
  }
}