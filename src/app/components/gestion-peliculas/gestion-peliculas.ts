import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

interface OpcionEdad {
    label: string;
    valor: number;
}

@Component({
    selector: 'app-gestion-peliculas',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './gestion-peliculas.html',
    styleUrl: './gestion-peliculas.css'
})
export class GestionPeliculasComponent implements OnInit {
    private supabase = inject(SupabaseService);
    private router = inject(Router);

    esAdmin = signal<boolean>(false);
    cargando = signal<boolean>(true);
    guardando = signal<boolean>(false);
    
    mensajeError = signal<string | null>(null);
    mensajeExito = signal<string | null>(null);

    titulo = signal<string>('');
    sinopsis = signal<string>('');
    duracionMinutos = signal<number>(120);
    formato = signal<string>('2D');
    restriccionEdad = signal<number>(0);
    estreno = signal<number>(new Date().getFullYear());

    archivoSeleccionado = signal<File | null>(null);
    vistaPreviaUrl = signal<string | null>(null);

    formatosDisponibles = ['2D', '3D', '4D', '5D'];
    opcionesEdad: OpcionEdad[] = [
        { label: 'ATP (Apta para Todo Público)', valor: 0 },
        { label: 'SAM 13 (+13)', valor: 13 },
        { label: 'SAM 16 (+16)', valor: 16 },
        { label: 'SAM 18 (+18)', valor: 18 }
    ];

    async ngOnInit(): Promise<void> {
        this.cargando.set(true);
        const admin = await this.supabase.esAdministrador();
        this.esAdmin.set(admin);
        this.cargando.set(false);
    }

    onArchivoSeleccionado(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            this.archivoSeleccionado.set(file);

            const reader = new FileReader();
            reader.onload = () => this.vistaPreviaUrl.set(reader.result as string);
            reader.readAsDataURL(file);
        }
    }

    async guardarPelicula(): Promise<void> {
        this.mensajeError.set(null);
        this.mensajeExito.set(null);

        if (!this.titulo().trim() || !this.sinopsis().trim() || !this.archivoSeleccionado()) {
            this.mensajeError.set('Completá el título, sinopsis y seleccioná un afiche.');
            return;
        }

        this.guardando.set(true);

        try {
            const aficheUrlPublica = await this.supabase.subirAfiche(this.archivoSeleccionado()!);

            const nuevaPelicula = {
                titulo: this.titulo().trim(),
                sinopsis: this.sinopsis().trim(),
                afiche_url: aficheUrlPublica,
                duracion_minutos: Number(this.duracionMinutos()),
                formato: this.formato(),
                restriccion_edad: Number(this.restriccionEdad()),
                disponibilidad: true,
                estreno: Number(this.estreno()),
                ventas_totales: 0,
                puntuacion_total: 0,
                puntuacion_cantidad: 0
            };

            const { error } = await this.supabase.client
                .from('peliculas')
                .insert([nuevaPelicula]);

            if (error) throw error;

            this.mensajeExito.set('¡Película dada de alta correctamente!');
            this.limpiarFormulario();

        } catch (err: any) {
            console.error('Error al guardar película:', err);
            this.mensajeError.set(err.message || 'Ocurrió un error al guardar la película.');
        } finally {
            this.guardando.set(false);
        }
    }

    private limpiarFormulario(): void {
        this.titulo.set('');
        this.sinopsis.set('');
        this.duracionMinutos.set(120);
        this.formato.set('2D');
        this.restriccionEdad.set(0);
        this.archivoSeleccionado.set(null);
        this.vistaPreviaUrl.set(null);
    }
}