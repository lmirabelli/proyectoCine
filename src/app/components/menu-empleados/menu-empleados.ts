import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-menu-empleados',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './menu-empleados.html',
  styleUrl: './menu-empleados.css'
})
export class MenuEmpleadosComponent {}