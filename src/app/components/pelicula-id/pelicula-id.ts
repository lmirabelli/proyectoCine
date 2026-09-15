import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { Pelicula } from '../../models/pelicula';

@Component({
  selector: 'app-pelicula-id',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pelicula-id.html',
  styleUrl: './pelicula-id.css'
})
export class DetallePeliculaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private supabase = inject(SupabaseService);

  pelicula: Pelicula | null = null;
  cargando: boolean = true;

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.pelicula = await this.supabase.getPeliculaPorId(id);
    }
    
    this.cargando = false;
  }
}