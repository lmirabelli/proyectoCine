import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { FuncionPelicula } from '../../models/funcion';
import { DisposicionButacasComponent } from '../disposicion-butacas/disposicion-butacas';
import { Butaca } from '../../models/butaca';
import Swal from 'sweetalert2';

export interface DiaOpcion {
    fechaStr: string;
    fecha: Date;
    esHoy: boolean;
}

@Component({
    selector: 'app-proceso-compra',
    standalone: true,
    imports: [CommonModule, FormsModule, DisposicionButacasComponent],
    templateUrl: './proceso-compra.html',
    styleUrl: './proceso-compra.css'
})
export class ProcesoCompraComponent implements OnInit {

    private _peliculaId: string = '';

    @Input() set id(val: string) {
        if (val && val !== this._peliculaId) {
            this._peliculaId = val;
            this.inicializarComponente();
        }
    }

    @Input() set peliculaId(val: string) {
        if (val && val !== this._peliculaId) {
            this._peliculaId = val;
            this.inicializarComponente();
        }
    }

    get peliculaId(): string {
        return this._peliculaId;
    }

    @Input() tituloPelicula: string = '';

    private supabase = inject(SupabaseService);
    private router = inject(Router);

    readonly precioBase = 12000;
    
    todasLasFunciones = signal<FuncionPelicula[]>([]);
    diasDisponibles = signal<DiaOpcion[]>([]);
    fechaSeleccionada = signal<string>('');
    funcionesDelDia = computed(() => {
        const fechaTarget = this.fechaSeleccionada();
        if (!fechaTarget) return [];

        return this.todasLasFunciones().filter(f => {
            const fechaFunc = new Date(f.inicio);
            const yyyy = fechaFunc.getFullYear();
            const mm = String(fechaFunc.getMonth() + 1).padStart(2, '0');
            const dd = String(fechaFunc.getDate()).padStart(2, '0');
            const strFunc = `${yyyy}-${mm}-${dd}`;
            return strFunc === fechaTarget;
        });
    });

    funcionSeleccionadaId = signal<string>('');
    cantidadEntradas = signal<number>(1);
    cargandoFunciones = signal<boolean>(false);
    procesando = signal<boolean>(false);
    porcentajeDescuentoEdad = signal<number>(0);
    edadUsuario = signal<number | null>(null);
    restriccionEdadPelicula = signal<number>(0);
    requiereAdulto = signal<boolean>(false);
    butacasSeleccionadas = signal<Butaca[]>([]);

    usuario = this.supabase.usuarioActual;

    porcentajeDescuentoTotal = computed(() => {
        return this.porcentajeDescuentoEdad();
    });

    porcentajeDescuentoMensaje = computed(() => {
        const descEdad = this.porcentajeDescuentoEdad();
        return descEdad > 0 ? '(Descuento por Edad)' : '';
    });

    funcionObjeto = computed(() => {
        return this.todasLasFunciones().find(f => f.id === this.funcionSeleccionadaId());
    });

    montoUnitario = computed(() => {
        const precioFuncion = this.funcionObjeto()?.precio ?? this.precioBase;
        const descuento = this.porcentajeDescuentoTotal();

        return descuento > 0 ? precioFuncion * (1 - descuento / 100) : precioFuncion;
    });

    montoFinal = computed(() => {
        return this.montoUnitario() * this.cantidadEntradas();
    });

    async ngOnInit(): Promise<void> {
        this.generarDiasSemana();
        await this.cargarDatosUsuarioYDescuentos();
        if (this._peliculaId) {
            await this.inicializarComponente();
        }
    }

    private generarDiasSemana(): void {
        const dias: DiaOpcion[] = [];
        const hoy = new Date();

        for (let i = 0; i < 7; i++) {
            const d = new Date(hoy);
            d.setDate(hoy.getDate() + i);

            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const fechaStr = `${yyyy}-${mm}-${dd}`;

            dias.push({
                fechaStr,
                fecha: d,
                esHoy: i === 0
            });
        }

        this.diasDisponibles.set(dias);
        if (dias.length > 0) {
            this.fechaSeleccionada.set(dias[0].fechaStr);
        }
    }

    private async inicializarComponente(): Promise<void> {
        if (!this._peliculaId) return;

        await Promise.all([
            this.cargarPelicula(),
            this.cargarFunciones()
        ]);
        this.evaluarRestriccionEdad();
    }

    private async cargarPelicula(): Promise<void> {
        try {
            const { data, error } = await this.supabase.client
                .from('peliculas')
                .select('titulo, restriccion_edad')
                .eq('id', this._peliculaId)
                .single();

            if (!error && data) {
                if (!this.tituloPelicula) {
                    this.tituloPelicula = data.titulo;
                }
                this.restriccionEdadPelicula.set(data.restriccion_edad ?? 0);
            }
        } catch (e) {
            console.error('Error al obtener datos de la película:', e);
        }
    }

    private async cargarDatosUsuarioYDescuentos(): Promise<void> {
        const usuarioSesion = this.supabase.usuarioActual();
        if (!usuarioSesion) return;

        try {
            const { data: perfil, error: errorPerfil } = await this.supabase.client
                .from('perfiles')
                .select('fecha_nacimiento')
                .eq('id', usuarioSesion.id)
                .single();

            if (errorPerfil || !perfil) return;

            if (perfil.fecha_nacimiento) {
                const edad = this.calcularEdad(perfil.fecha_nacimiento);
                this.edadUsuario.set(edad);
                await this.evaluarDescuentoPorEdad(edad);
            }
        } catch (err) {
            console.error('Error al cargar datos del usuario:', err);
        }
    }

    private evaluarRestriccionEdad(): void {
        const edad = this.edadUsuario();
        const restriccion = this.restriccionEdadPelicula();

        if (edad !== null && restriccion > 0 && edad < restriccion) {
            this.requiereAdulto.set(true);
        } else {
            this.requiereAdulto.set(false);
        }
    }

    private calcularEdad(fechaNacimientoStr: string): number {
        const hoy = new Date();
        const nacimiento = new Date(fechaNacimientoStr);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();

        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }
        return edad;
    }

    private async evaluarDescuentoPorEdad(edad: number): Promise<void> {
        const { data: reglas, error } = await this.supabase.client
            .from('descuentos')
            .select('*');

        if (error || !reglas) return;

        const reglaAplicable = reglas.find((r: any) => edad >= r.edad_minima);

        if (reglaAplicable && reglaAplicable.porcentaje) {
            this.porcentajeDescuentoEdad.set(reglaAplicable.porcentaje);
        } else {
            this.porcentajeDescuentoEdad.set(0);
        }
    }

    private async cargarFunciones(): Promise<void> {
        if (!this._peliculaId) return;

        this.cargandoFunciones.set(true);

        try {
            const { data, error } = await this.supabase.client
                .from('funciones')
                .select('*, salas(*)')
                .eq('pelicula_id', String(this._peliculaId))
                .order('inicio', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                const ahora = new Date();
                const limiteSemana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 7, 23, 59, 59);

                const funcionesValidas = data.filter((f: any) => {
                    const fechaFuncion = new Date(f.inicio);
                    return fechaFuncion >= ahora && fechaFuncion <= limiteSemana;
                });

                this.todasLasFunciones.set(funcionesValidas);
                this.autoSeleccionarPrimerHorario();
            } else {
                this.todasLasFunciones.set([]);
                this.funcionSeleccionadaId.set('');
            }
        } catch (err) {
            console.error('Error al cargar funciones:', err);
        } finally {
            this.cargandoFunciones.set(false);
        }
    }

    seleccionarFecha(fechaStr: string): void {
        this.fechaSeleccionada.set(fechaStr);
        this.autoSeleccionarPrimerHorario();
    }

    private autoSeleccionarPrimerHorario(): void {
        const disponibles = this.funcionesDelDia();
        if (disponibles.length > 0) {
            this.funcionSeleccionadaId.set(disponibles[0].id);
        } else {
            this.funcionSeleccionadaId.set('');
        }
    }

    onButacasCambiadas(butacas: Butaca[]): void {
        this.butacasSeleccionadas.set(butacas);
    }

    modificarCantidad(cambio: number): void {
        const nuevaCant = this.cantidadEntradas() + cambio;
        if (nuevaCant >= 1 && nuevaCant <= 10) {
            this.cantidadEntradas.set(nuevaCant);
        }
    }

    finalizarCompra(): void {
        const funcion = this.funcionObjeto();

        if (!funcion) {
            Swal.fire({
                icon: 'warning',
                title: 'Selección requerida',
                text: 'Por favor seleccioná una función disponible.'
            });
            return;
        }

        const asientosElegidos = this.butacasSeleccionadas().map(b => b.id);
        if (asientosElegidos.length !== this.cantidadEntradas()) {
            Swal.fire({
                icon: 'warning',
                title: 'Selección de butacas incompleta',
                text: `Debes seleccionar exactamente ${this.cantidadEntradas()} asiento(s) para continuar.`
            });
            return;
        }

        this.procesando.set(true);

        const idSalaObtenido = funcion.salas?.id || (funcion as any).id_sala || (funcion as any).sala_id || null;

        const datosEntradas = {
            peliculaId: this._peliculaId,
            tituloPelicula: this.tituloPelicula,
            funcionId: funcion.id,
            salaId: idSalaObtenido,
            formato: funcion.formato || funcion.salas?.formato || '2D',
            idioma: funcion.idioma,
            cantidad: this.cantidadEntradas(),
            montoTotal: this.montoFinal(),
            sala: funcion.salas?.nombre ?? 'Sala Principal',
            fechaInicio: funcion.inicio,
            fechaReserva: new Date().toISOString(),
            requiereAdulto: this.requiereAdulto(),
            asientos: asientosElegidos
        };

        localStorage.setItem('reserva_entradas_pendiente', JSON.stringify(datosEntradas));
        this.router.navigate(['/candybar']);
    }
}