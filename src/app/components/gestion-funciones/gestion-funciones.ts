import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

interface Pelicula {
    id: string;
    titulo: string;
    duracion_minutos: number;
}

interface Sala {
    id: string;
    nombre: string;
    capacidad: number;
    precio: number;
    formato: string;
}

interface Funcion {
    id?: string;
    pelicula_id: string;
    sala_id: string;
    formato: string;
    idioma: string;
    precio: number;
    inicio: string;
    fin: string;
    peliculas?: { titulo: string };
    salas?: { nombre: string };
}

@Component({
    selector: 'app-gestion-funciones',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './gestion-funciones.html',
    styleUrl: './gestion-funciones.css'
})
export class GestionFuncionesComponent implements OnInit {
    private supabase = inject(SupabaseService);

    esAdmin = signal<boolean>(false);
    cargando = signal<boolean>(true);
    guardando = signal<boolean>(false);
    mensajeError = signal<string | null>(null);
    mensajeExito = signal<string | null>(null);

    peliculas = signal<Pelicula[]>([]);
    salas = signal<Sala[]>([]);
    funciones = signal<Funcion[]>([]);

    peliculaSeleccionadaId = signal<string>('');
    salaSeleccionadaId = signal<string>('');
    idiomaSeleccionado = signal<string>('Castellano');
    fechaInicioInput = signal<string>('');

    idiomasDisponibles = ['Castellano', 'Subtitulada'];

    salaObjeto = computed(() =>
        this.salas().find(s => s.id === this.salaSeleccionadaId())
    );

    formatoSeleccionado = computed(() => this.salaObjeto()?.formato ?? '');
    precioInput = computed(() => this.salaObjeto()?.precio ?? 0);

    peliculaObjeto = computed(() => 
        this.peliculas().find(p => p.id === this.peliculaSeleccionadaId())
    );

    fechaFinPelicula = computed(() => {
        const pelicula = this.peliculaObjeto();
        const inicioStr = this.fechaInicioInput();

        if (!pelicula || !inicioStr) return null;

        const inicio = new Date(inicioStr);
        return new Date(inicio.getTime() + pelicula.duracion_minutos * 60000);
    });

    fechaFinLiberacionSala = computed(() => {
        const finPeli = this.fechaFinPelicula();
        if (!finPeli) return null;

        return new Date(finPeli.getTime() + 30 * 60 * 1000);
    });

    async ngOnInit(): Promise<void> {
        await this.verificarAcceso();
    }

    private async verificarAcceso(): Promise<void> {
        this.cargando.set(true);
        const esAdministrador = await this.supabase.esAdministrador();
        this.esAdmin.set(esAdministrador);

        if (esAdministrador) {
            await Promise.all([
                this.cargarPeliculas(),
                this.cargarSalas(),
                this.cargarFunciones()
            ]);
        }
        this.cargando.set(false);
    }

    private async cargarPeliculas(): Promise<void> {
        const { data, error } = await this.supabase.client
            .from('peliculas')
            .select('id, titulo, duracion_minutos');

        if (!error && data) {
            this.peliculas.set(data);
        }
    }

    private async cargarSalas(): Promise<void> {
        const { data, error } = await this.supabase.client
            .from('salas')
            .select('id, nombre, capacidad, precio, formato');

        if (!error && data) {
            this.salas.set(data);
            if (data.length > 0) {
                this.salaSeleccionadaId.set(data[0].id);
            }
        }
    }

    private async cargarFunciones(): Promise<void> {
        const { data, error } = await this.supabase.client
            .from('funciones')
            .select('*, peliculas(titulo), salas(nombre)')
            .order('inicio', { ascending: true });

        if (!error && data) {
            this.funciones.set(data);
        }
    }

    private validarDisponibilidadSala(
        salaId: string, 
        inicioNuevo: Date, 
        finNuevoPelicula: Date
    ): { valido: boolean; motivo?: string } {
        const MARGEN_LIMPIEZA_MS = 30 * 60 * 1000;
        
        const inicioNuevoMs = inicioNuevo.getTime();
        const finNuevoConLimpiezaMs = finNuevoPelicula.getTime() + MARGEN_LIMPIEZA_MS;

        const funcionesEnSala = this.funciones().filter(f => f.sala_id === salaId);

        for (const f of funcionesEnSala) {
            const inicioExistenteMs = new Date(f.inicio).getTime();
            const finExistentePeliMs = new Date(f.fin).getTime();
            const finExistenteConLimpiezaMs = finExistentePeliMs + MARGEN_LIMPIEZA_MS;

            if (inicioNuevoMs >= inicioExistenteMs && inicioNuevoMs < finExistenteConLimpiezaMs) {
                const disponibleA = new Date(finExistenteConLimpiezaMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return { 
                    valido: false, 
                    motivo: `La sala está ocupada por "${f.peliculas?.titulo}". Estará disponible desde las ${disponibleA} hs.` 
                };
            }

            if (inicioNuevoMs < inicioExistenteMs && finNuevoConLimpiezaMs > inicioExistenteMs) {
                const inicioSiguiente = new Date(inicioExistenteMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return { 
                    valido: false, 
                    motivo: `La nueva función termina su limpieza a las ${new Date(finNuevoConLimpiezaMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs.` 
                };
            }
        }

        return { valido: true };
    }

    async crearFuncion(): Promise<void> {
        this.mensajeError.set(null);
        this.mensajeExito.set(null);

        const { data: { session }, error: sessionError } = await this.supabase.client.auth.getSession();

        if (sessionError || !session) {
            this.mensajeError.set('Ups, se venció tu sesión. Volvé a iniciar.');
            return;
        }

        if (!this.peliculaSeleccionadaId() || !this.salaSeleccionadaId() || !this.fechaInicioInput()) {
            this.mensajeError.set('Falta completar datos');
            return;
        }

        const inicio = new Date(this.fechaInicioInput());
        const finPelicula = this.fechaFinPelicula();

        if (!finPelicula) return;

        if (inicio.getTime() < Date.now()) {
            this.mensajeError.set('No tenemos el delorean, no se pueden programar funciones en el pasado.');
            return;
        }

        const disponibilidad = this.validarDisponibilidadSala(this.salaSeleccionadaId(), inicio, finPelicula);
        if (!disponibilidad.valido) {
            this.mensajeError.set(`Conflicto de Horario: ${disponibilidad.motivo}`);
            return;
        }

        this.guardando.set(true);

        try {
            const nuevaFuncion = {
                pelicula_id: this.peliculaSeleccionadaId(),
                sala_id: this.salaSeleccionadaId(),
                formato: this.formatoSeleccionado(),
                idioma: this.idiomaSeleccionado(),
                precio: this.precioInput(),
                inicio: inicio.toISOString(),
                fin: finPelicula.toISOString(),
                ventas: 0
            };

            const { error } = await this.supabase.client
                .from('funciones')
                .insert([nuevaFuncion]);

            if (error) throw error;

            this.mensajeExito.set('¡Función programada!');
            this.fechaInicioInput.set('');
            await this.cargarFunciones();

        } catch (error: any) {
            console.error('Error al guardar la función:', error);
            this.mensajeError.set(error.message || '(ERROR)');
        } finally {
            this.guardando.set(false);
        }
    }
}