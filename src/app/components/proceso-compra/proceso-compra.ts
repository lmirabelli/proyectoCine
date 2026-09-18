import { Component, Input,inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComprobanteReserva, FormatoProyeccion, IdiomaProyeccion } from '../../models/reserva';
import { PdfService } from '../../services/pdf';

@Component({
    selector: 'app-proceso-compra',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './proceso-compra.html',
    styleUrl: './proceso-compra.css'
})
export class ProcesoCompraComponent {

    @Input() peliculaId!: string;
    @Input() tituloPelicula!: string;
    private pdfService = inject(PdfService);

    formatos: FormatoProyeccion[] = ['2D', '3D', '4D', '5D'];
    idiomas: IdiomaProyeccion[] = ['Castellano', 'Subtitulada'];

    formatoSeleccionado = signal<FormatoProyeccion>('2D');
    idiomaSeleccionado = signal<IdiomaProyeccion>('Castellano');
    procesando = signal<boolean>(false);

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
                montoTotal: 12000,
                fechaCompra: new Date().toISOString(),
                codigoQR: ''
            };

            await this.pdfService.generarComprobantePDF(nuevaReserva);

            alert('¡Compra realizada con éxito! Se ha descargado tu comprobante.');
        } catch (error) {
            console.error('Error al procesar la compra:', error);
            alert('Ocurrió un error al generar el comprobante.');
        } finally {
            this.procesando.set(false);
        }
    }
}