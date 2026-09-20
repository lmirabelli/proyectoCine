import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComprobanteReserva, FormatoProyeccion, IdiomaProyeccion } from '../../models/reserva';
import { PdfService } from '../../services/pdf';
import { SupabaseService } from '../../services/supabase';

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

    private pdfService = inject(PdfService);
    private supabase = inject(SupabaseService);

    readonly precioBase = 12000;

    formatos: FormatoProyeccion[] = ['2D', '3D', '4D', '5D'];
    idiomas: IdiomaProyeccion[] = ['Castellano', 'Subtitulada'];

    formatoSeleccionado = signal<FormatoProyeccion>('2D');
    idiomaSeleccionado = signal<IdiomaProyeccion>('Castellano');
    procesando = signal<boolean>(false);

    cantidadCompras = signal<number>(0);
    esPrimeraCompra = computed(() => this.cantidadCompras() === 0);


    montoFinal = computed(() => {
        if (this.esPrimeraCompra()) {
            return this.precioBase * 0.8;
        }
        return this.precioBase;
    });

    async ngOnInit(): Promise<void> {
        await this.cargarComprasUsuario();
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

    async finalizarCompra(): Promise<void> {
        this.procesando.set(true);

        try {
            const nuevaReserva: ComprobanteReserva = {
                idReserva: 'RES-' + Math.floor(100000 + Math.random() * 900000),
                peliculaId: this.peliculaId,
                tituloPelicula: this.tituloPelicula,
                formato: this.formatoSeleccionado(),
                idioma: this.idiomaSeleccionado(),
                asientos: ['F4', 'F5'],
                montoTotal: this.montoFinal(),
                fechaCompra: new Date().toISOString(),
                codigoQR: ''
            };

            // 1. Generar y descargar el comprobante en PDF
            await this.pdfService.generarComprobantePDF(nuevaReserva);

            // 2. Incrementar la columna 'compras' en Supabase
            const usuarioSesion = this.supabase.usuarioActual();
            if (usuarioSesion) {
                const nuevasCompras = this.cantidadCompras() + 1;

                const { error } = await this.supabase.client
                    .from('perfiles')
                    .update({ compras: nuevasCompras })
                    .eq('id', usuarioSesion.id);

                if (!error) {
                    this.cantidadCompras.set(nuevasCompras);
                }
            }

            alert('¡Compra realizada con éxito! Se ha descargado tu comprobante.');
        } catch (error) {
            console.error('Error al procesar la compra:', error);
            alert('Ocurrió un error al generar el comprobante.');
        } finally {
            this.procesando.set(false);
        }
    }
}