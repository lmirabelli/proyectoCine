import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pelicula } from '../../models/pelicula';

@Component({
  selector: 'app-tarjeta-pelicula',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tarjeta-pelicula.html',
  styleUrl: './tarjeta-pelicula.css'
})
export class TarjetaPeliculaComponent {
  @Input({ required: true }) pelicula!: Pelicula;
  @Input() esDestacada: boolean = false;
  @Input() rankingIndex?: number;

  @Output() seleccionar = new EventEmitter<Pelicula>();

  onSeleccionar(): void {
    this.seleccionar.emit(this.pelicula);
  }
}