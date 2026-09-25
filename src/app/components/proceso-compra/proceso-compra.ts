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

    cantidadCompras = signal<number>(0);
    esPrimeraCompra = computed(() => this.cantidadCompras() === 0);

    funcionObjeto = computed(() => {
        return this.funciones().find(f => f.id === this.funcionSeleccionadaId());
    });

    montoUnitario = computed(() => {
        const precioFuncion = this.funcionObjeto()?.precio ?? this.precioBase;
        return this.esPrimeraCompra() ? precioFuncion * 0.8 : precioFuncion;
    });

    montoFinal = computed(() => {
        return this.montoUnitario() * this.cantidadEntradas();
    });

    async ngOnInit(): Promise<void> {
        await Promise.all([
            this.cargarComprasUsuario(),
            this.cargarFunciones()
        ]);
    }

    private async cargarComprasUsuario(): Promise<void> {
        const usuarioSesion = this.supabase.usuarioActual();
        if (!usuarioSesion) return;

        const { data, error } = await this.supabase.client
            .from('perfiles')
            .select('compras')
            .eq('id', usuarioSesion.id)
            .single();

        if (!error && data) {
            this.cantidadCompras.set(data.compras ?? 0);
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