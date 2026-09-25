import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { Pelicula } from '../../models/pelicula';
import { Sala } from '../../models/sala';
import { FuncionPelicula } from '../../models/funcion';

@Component({
    selector: 'app-gestion-funciones',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './gestion-funciones.html',
    styleUrl: './gestion-funciones.css',
})
export class GestionFuncionesComponent implements OnInit {
    private supabase = inject(SupabaseService);

    esAdmin = signal<boolean>(false);
    cargando = signal<boolean>(true);
    guardando = signal<boolean>(false);
    mensajeError = signal<string | null>(null);
    mensajeExito = signal<string | null>(null);

    peliculas = signal<Partial<Pelicula>[]>([]);
    salas = signal<Sala[]>([]);
    funciones = signal<FuncionPelicula[]>([]);

    peliculaSeleccionadaId = signal<string>('');
    salaSeleccionadaId = signal<string>('');
    idiomaSeleccionado = signal<string>('Castellano');
    fechaInicioInput = signal<string>('');

    idiomasDisponibles = ['Castellano', 'Subtitulada'];

    salaObjeto = computed(() => this.salas().find((s) => s.id === this.salaSeleccionadaId()));

    formatoSeleccionado = computed(() => this.salaObjeto()?.formato ?? '');
    precioInput = computed(() => this.salaObjeto()?.precio ?? 0);

    peliculaObjeto = computed(() =>
        this.peliculas().find((p) => p.id === this.peliculaSeleccionadaId()),
    );

    fechaFinPelicula = computed(() => {
        const pelicula = this.peliculaObjeto();
        const inicioStr = this.fechaInicioInput();

        if (!pelicula || !pelicula.duracion_minutos || !inicioStr) return null;

        const inicio = new Date(inicioStr);
        const MARGEN_LIMPIEZA_MS = 30 * 60 * 1000;

        return new Date(inicio.getTime() + pelicula.duracion_minutos * 60000 + MARGEN_LIMPIEZA_MS);
    });

    async ngOnInit(): Promise<void> {
        await this.verificarAcceso();
    }

    private async verificarAcceso(): Promise<void> {
        this.cargando.set(true);
        const esAdministrador = await this.supabase.esAdministrador();
        this.esAdmin.set(esAdministrador);

        if (esAdministrador) {
            await Promise.all([this.cargarPeliculas(), this.cargarSalas(), this.cargarFunciones()]);
        }
        this.cargando.set(false);
    }

    private async cargarPeliculas(): Promise<void> {
        const { data, error } = await this.supabase.client
            .from('peliculas')
            .select('id, titulo, duracion_minutos, formato');

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

    private formatearParaInput(date: Date): string {
        const pad = (num: number) => num.toString().padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    calcularSalaYHorarioAutomatico(): void {
        this.mensajeError.set(null);
        this.mensajeExito.set(null);

        const pelicula = this.peliculaObjeto();
        if (!pelicula || !pelicula.duracion_minutos) {
            this.mensajeError.set('Seleccioná una película para calcular el horario y la sala.');
            return;
        }

        const formatoPeli = (pelicula.formato || '2D').toString().trim().toUpperCase();

        const salasCompatibles = this.salas().filter((s) => {
            const formatoSala = (s.formato || '').toString().trim().toUpperCase();
            return (
                formatoSala === formatoPeli ||
                formatoSala.includes(formatoPeli) ||
                formatoPeli.includes(formatoSala)
            );
        });

        if (salasCompatibles.length === 0) {
            this.mensajeError.set(
                `No existen salas compatibles registradas para el formato ${formatoPeli}.`,
            );
            return;
        }

        const AHORA = new Date();
        const MARGEN_LIMPIEZA_MS = 30 * 60 * 1000;
        const DOS_HORAS_MS = 2 * 60 * 60 * 1000;

        let mejorSala: Sala | null = null;
        let mejorFechaInicio: Date | null = null;

        for (const sala of salasCompatibles) {
            const funcionesDeSala = this.funciones()
                .filter((f) => f.sala_id === sala.id)
                .sort((a, b) => new Date(b.fin).getTime() - new Date(a.fin).getTime());

            const ultimaFuncion = funcionesDeSala[0];

            let inicioCalculado: Date;

            if (ultimaFuncion) {
                const finUltimaFuncion = new Date(ultimaFuncion.fin);

                if (finUltimaFuncion.getTime() > AHORA.getTime()) {
                    inicioCalculado = new Date(finUltimaFuncion.getTime() + MARGEN_LIMPIEZA_MS);
                } else {
                    inicioCalculado = new Date(AHORA.getTime() + DOS_HORAS_MS);
                }
            } else {
                inicioCalculado = new Date(AHORA.getTime() + DOS_HORAS_MS);
            }

            if (!mejorFechaInicio || inicioCalculado.getTime() < mejorFechaInicio.getTime()) {
                mejorFechaInicio = inicioCalculado;
                mejorSala = sala;
            }
        }

        if (mejorSala && mejorFechaInicio) {
            this.salaSeleccionadaId.set(mejorSala.id);
            this.fechaInicioInput.set(this.formatearParaInput(mejorFechaInicio));

            this.mensajeExito.set(
                `Asignación automática: ${mejorSala.nombre} (${formatoPeli}) a las ${mejorFechaInicio.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs.`,
            );
        }
    }

    async crearFuncion(): Promise<void> {
        this.mensajeError.set(null);
        this.mensajeExito.set(null);

        const pelicula = this.peliculaObjeto();
        const sala = this.salaObjeto();

        if (!pelicula || !sala || !this.fechaInicioInput()) {
            this.mensajeError.set(
                'Por favor completa todos los datos o ejecutá la asignación automática.',
            );
            return;
        }

        const inicio = new Date(this.fechaInicioInput());
        const finPelicula = this.fechaFinPelicula();

        if (!finPelicula) return;

        if (inicio.getTime() < Date.now()) {
            this.mensajeError.set('No se pueden programar funciones en el pasado.');
            return;
        }

        const inicioNuevo = inicio.getTime();
        const finNuevo = finPelicula.getTime();

        const funcionSolapada = this.funciones().find((f) => {
            if (f.sala_id !== sala.id) return false;

            const inicioExistente = new Date(f.inicio).getTime();
            const finExistente = new Date(f.fin).getTime();

            return inicioNuevo < finExistente && finNuevo > inicioExistente;
        });

        if (funcionSolapada) {
            this.mensajeError.set(
                `La sala "${sala.nombre}" ya tiene una función ocupada en ese rango horario.`,
            );
            return;
        }

        this.guardando.set(true);

        try {
            const nuevaFuncion = {
                pelicula_id: pelicula.id,
                sala_id: sala.id,
                formato: (pelicula.formato || '2D').toUpperCase(),
                idioma: this.idiomaSeleccionado(),
                precio: sala.precio,
                inicio: inicio.toISOString(),
                fin: finPelicula.toISOString(),
                ventas: 0,
            };

            const { error } = await this.supabase.client.from('funciones').insert([nuevaFuncion]);

            if (error) throw error;

            this.mensajeExito.set(`¡Función programada con éxito en ${sala.nombre}!`);
            this.fechaInicioInput.set('');
            this.salaSeleccionadaId.set('');
            await this.cargarFunciones();
        } catch (error: any) {
            console.error('Error al guardar la función:', error);
            this.mensajeError.set(error.message || '(ERROR)');
        } finally {
            this.guardando.set(false);
        }
    }
}
