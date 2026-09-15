import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-buscador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buscador.html',
  styleUrl: './buscador.css'
})
export class Buscador {
  @Output() buscar = new EventEmitter<string>();

  busqueda: string = '';

  onBuscarSubmit(): void {
    this.buscar.emit(this.busqueda.trim());
  }

  limpiarBuscador(): void {
    this.busqueda = '';
    this.buscar.emit('');
  }
}