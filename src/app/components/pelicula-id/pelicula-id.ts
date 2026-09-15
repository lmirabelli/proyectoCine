import { Component, OnInit, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { Pelicula } from '../../models/pelicula';

@Component({
    selector: 'app-pelicula-id',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './pelicula-id.html',
    styleUrl: './pelicula-id.css'
})
export class PeliculaIdComponent implements OnInit {
    private supabase = inject(SupabaseService);

    id = input<string>();

    pelicula = signal<Pelicula | null>(null);
    cargando = signal<boolean>(true);

    async ngOnInit(): Promise<void> {
        const peliculaId = this.id();

        if (peliculaId) {
            try {
                const data = await this.supabase.getPeliculaPorId(peliculaId);
                this.pelicula.set(data);
            } catch (error) {
                console.error('Error al cargar la película:', error);
            }
        }

        this.cargando.set(false);
    }
}