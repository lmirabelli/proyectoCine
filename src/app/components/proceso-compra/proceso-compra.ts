import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { FuncionPelicula } from '../../models/funcion';
import { DisposicionButacasComponent } from '../disposicion-butacas/disposicion-butacas';
import { Butaca } from '../../models/butaca';

@Component({
    selector: 'app-proceso-compra',
    standalone: true,
    imports: [CommonModule, FormsModule, DisposicionButacasComponent],
    templateUrl: './proceso-compra.html',
    styleUrl: './proceso-compra.css'
})
export class ProcesoCompraComponent implements OnInit {

    @Input() peliculaId!: string;
    @Input() tituloPelicula!: string;
    private supabase = inject(SupabaseService);
    private router = inject(Router);
    readonly precioBase = 12000;
    funciones = signal<FuncionPelicula[]>([]);
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
        return this.funciones().find(f => f.id === this.funcionSeleccionadaId());
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
        await Promise.all([
            this.cargarDatosUsuarioYDescuentos(),
            this.cargarPelicula(),
            this.cargarFunciones()
        ]);
        this.evaluarRestriccionEdad();
    }

    private async cargarPelicula(): Promise<void> {
        if (!this.peliculaId) return;

        try {
            const { data, error } = await this.supabase.client
                .from('peliculas')
                .select('restriccion_edad')
                .eq('id', this.peliculaId)
                .single();

            if (!error && data) {
                this.restriccionEdadPelicula.set(data.restriccion_edad ?? 0);
            }
        } catch (e) {
            console.error('Error al obtener la restricción de edad de la película:', e);
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
        console.log(edad);
        return edad;
    }

    private async evaluarDescuentoPorEdad(edad: number): Promise<void> {
        const { data: reglas, error } = await this.supabase.client
            .from('descuentos')
            .select('*');

        if (error || !reglas) return;

        const reglaAplicable = reglas.find((r: any) => {
            console.log(r.edad_minima)

            const aplicaDescuento = edad >= r.edad_minima
            return aplicaDescuento;
        });

        if (reglaAplicable && reglaAplicable.porcentaje) {
            this.porcentajeDescuentoEdad.set(reglaAplicable.porcentaje);
        } else {
            this.porcentajeDescuentoEdad.set(0);
        }
    }

    private async cargarFunciones(): Promise<void> {
        if (!this.peliculaId) return;

        this.cargandoFunciones.set(true);

        const { data, error } = await this.supabase.client
            .from('funciones')
            .select('*, salas!inner(id, nombre, formato)')
            .eq('pelicula_id', this.peliculaId)
            .order('inicio', { ascending: true });

        if (!error && data) {
            const ahora = new Date();
            const limiteManana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 2, 0, 0, 0);

            const funcionesValidas = data.filter((f: FuncionPelicula) => {
                const fechaFuncion = new Date(f.inicio);
                return fechaFuncion > ahora && fechaFuncion < limiteManana;
            });

            this.funciones.set(funcionesValidas);

            if (funcionesValidas.length > 0) {
                this.funcionSeleccionadaId.set(funcionesValidas[0].id);
            } else {
                this.funcionSeleccionadaId.set('');
            }
        }

        this.cargandoFunciones.set(false);
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
            alert('Por favor seleccioná una función disponible.');
            return;
        }

        const asientosElegidos = this.butacasSeleccionadas().map(b => b.id);
        if (asientosElegidos.length !== this.cantidadEntradas()) {
            alert(`Debes seleccionar exactamente ${this.cantidadEntradas()} asiento(s) para continuar.`);
            return;
        }

        this.procesando.set(true);

        const idSalaObtenido = funcion.salas?.id || (funcion as any).id_sala || (funcion as any).sala_id || null;

        const datosEntradas = {
            peliculaId: this.peliculaId,
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