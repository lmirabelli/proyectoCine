import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Pelicula } from '../../models/pelicula';

@Component({
  imports: [CommonModule],
  selector: 'app-destacados',
  styleUrl: './destacados.css',
  templateUrl: './destacados.html',
})
export class Destacados {
  @Input({ required: true }) pelicula!: Pelicula;
  @Input() esDestacada: boolean = false;
  @Input() rankingIndex?: number;

  @Output() seleccionar = new EventEmitter<Pelicula>();


  onSeleccionar(): void {
    this.seleccionar.emit(this.pelicula);
  }
}
