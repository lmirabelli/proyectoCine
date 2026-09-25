import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { FuncionPelicula } from '../../models/funcion';

@Component({
    selector: 'app-proceso-compra',
    standalone: true,
    imports: [CommonModule, FormsModule],
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
            this.cargarFunciones()
        ]);
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
                await this.evaluarDescuentoPorEdad(edad);
            }
        } catch (err) {
            console.error('Error al cargar datos de descuento por edad del usuario:', err);
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

        const reglaAplicable = reglas.find((r: any) => {
            const min = r.edad_min ?? 0;
            const max = r.edad_max ?? 120;
            return edad >= min && edad <= max;
        });

        if (reglaAplicable && reglaAplicable.porcentaje) {
            this.porcentajeDescuentoEdad.set(reglaAplicable.porcentaje);
        }
    }

    private async cargarFunciones(): Promise<void> {
        if (!this.peliculaId) return;

        this.cargandoFunciones.set(true);

        const { data, error } = await this.supabase.client
            .from('funciones')
            .select('*, salas(nombre, formato)')
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

        this.procesando.set(true);

        const datosEntradas = {
            peliculaId: this.peliculaId,
            tituloPelicula: this.tituloPelicula,
            funcionId: funcion.id,
            formato: funcion.formato || funcion.salas?.formato || '2D',
            idioma: funcion.idioma,
            cantidad: this.cantidadEntradas(),
            montoTotal: this.montoFinal(),
            sala: funcion.salas?.nombre ?? 'Sala Principal',
            fechaInicio: funcion.inicio,
            fechaReserva: new Date().toISOString()
        };

        localStorage.setItem('reserva_entradas_pendiente', JSON.stringify(datosEntradas));

        this.router.navigate(['/candybar']);
    }
}