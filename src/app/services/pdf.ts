import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { ComprobanteReserva } from '../models/reserva';

@Injectable({
    providedIn: 'root'
})
export class PdfService {

    private async cargarImagenBase64(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = (err) => reject(err);
            img.src = url;
        });
    }

    async generarComprobantePDF(datos: ComprobanteReserva): Promise<void> {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a6'
        });

        const qrData = JSON.stringify({
            id: datos.idReserva,
            pelicula: datos.tituloPelicula ?? 'N/A',
            entradas: datos.cantidadEntradas ?? 0,
            candyItems: datos.itemsCandy?.length ?? 0
        });
        const qrImageBase64 = await QRCode.toDataURL(qrData, { margin: 1 });

        let posY = 10;

        // ------------------------------------------------------- LOGO
        try {
            const logoBase64 = await this.cargarImagenBase64('/logo.png');
            doc.addImage(logoBase64, 'PNG', 41.5, posY, 12, 12);
            posY += 25;
        } catch (e) {
            console.warn('No se pudo cargar el logo para el PDF:', e);
            posY += 2;
        }

        // ----------------------------------------------------- ENCABEZADO 
        doc.setFont('helvetica', 'bolditalic');
        doc.setFontSize(14);
        doc.text('SALAS DE CINE - PUCHITO PUCHITO', 52.5, posY, { align: 'center' });
        posY += 12;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('COMPROBANTE DE COMPRA', 52.5, posY, { align: 'center' });
        posY += 5;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Reserva #: ${datos.idReserva}`, 52.5, posY, { align: 'center' });
        posY += 3;

        doc.setLineWidth(0.5);
        doc.line(8, posY, 97, posY);
        posY += 6;

        // ------------------------------------------------------------- ENTRADAS
        if (datos.tituloPelicula && datos.tituloPelicula !== 'Solo Candy Bar') {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text('--- CINE ---', 52.5, posY, { align: 'center' });
            posY += 5;

            doc.setFontSize(8);
            doc.text('Película:', 8, posY);
            doc.setFont('helvetica', 'normal');
            doc.text(datos.tituloPelicula, 32, posY);
            posY += 5;

            const cantEntradas = datos.cantidadEntradas ?? 0;
            doc.setFont('helvetica', 'bold');
            doc.text('Cant. Entradas:', 8, posY);
            doc.setFont('helvetica', 'normal');
            doc.text(String(cantEntradas), 32, posY);
            posY += 5;

            doc.setFont('helvetica', 'bold');
            doc.text('Formato:', 8, posY);
            doc.setFont('helvetica', 'normal');
            doc.text(`${datos.formato ?? '2D'} - ${datos.idioma ?? 'SUB'}`, 32, posY);
            posY += 5;

            if (datos.sala) {
                doc.setFont('helvetica', 'bold');
                doc.text('Sala / Función:', 8, posY);
                doc.setFont('helvetica', 'normal');
                doc.text(datos.sala, 32, posY);
                posY += 5;
            }

            if (datos.asientos && datos.asientos.length > 0) {
                doc.setFont('helvetica', 'bold');
                doc.text('Asientos:', 8, posY);
                doc.setFont('helvetica', 'normal');
                doc.text(datos.asientos.join(', '), 32, posY);
                posY += 5;
            }
        }

        // ----------------------------------------------------------- COSITAS RICAS DEL CANDY
        if (datos.itemsCandy && datos.itemsCandy.length > 0) {
            posY += 2;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text('--- CANDY BAR ---', 52.5, posY, { align: 'center' });
            posY += 5;

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            datos.itemsCandy.forEach(item => {
                const linea = `${item.cantidad}x ${item.nombre}`;
                const precio = `$${item.subtotal}`;
                doc.text(linea, 8, posY);
                doc.text(precio, 97, posY, { align: 'right' });
                posY += 4;
            });
        }

        // ----------------------------------------------------------------------- TOTAL Y QR
        posY += 2;
        doc.line(8, posY, 97, posY);
        posY += 5;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('TOTAL:', 8, posY);
        doc.text(`$${datos.montoTotal}`, 97, posY, { align: 'right' });

        posY += 6;
        const qrPosY = Math.min(posY, 90);
        doc.addImage(qrImageBase64, 'PNG', 34, qrPosY, 35, 35);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Presentá este QR en la entrada o el Candy', 52.5, qrPosY + 39, { align: 'center' });

        doc.save(`Ticket_${datos.idReserva}.pdf`);
    }
}