import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { ComprobanteReserva } from '../models/reserva';

@Injectable({
    providedIn: 'root'
})
export class PdfService {

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

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('COMPROBANTE DE COMPRA', 52.5, 12, { align: 'center' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Reserva #: ${datos.idReserva}`, 52.5, 18, { align: 'center' });

        doc.setLineWidth(0.5);
        doc.line(8, 21, 97, 21);

        let posY = 27;

        if (datos.tituloPelicula && datos.tituloPelicula !== 'Solo Candy Bar') {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text('--- CINE ---', 52.5, posY, { align: 'center' });
            posY += 5;

            doc.setFontSize(8);
            doc.text('Película:', 8, posY);
            doc.setFont('helvetica', 'normal');
            doc.text(datos.tituloPelicula, 28, posY);
            posY += 5;

            doc.setFont('helvetica', 'bold');
            doc.text('Formato:', 8, posY);
            doc.setFont('helvetica', 'normal');
            doc.text(`${datos.formato ?? '2D'} - ${datos.idioma ?? 'SUB'}`, 28, posY);
            posY += 5;

            if (datos.sala) {
                doc.setFont('helvetica', 'bold');
                doc.text('Sala:', 8, posY);
                doc.setFont('helvetica', 'normal');
                doc.text(datos.sala, 28, posY);
                posY += 5;
            }

            if (datos.asientos && datos.asientos.length > 0) {
                doc.setFont('helvetica', 'bold');
                doc.text('Asientos:', 8, posY);
                doc.setFont('helvetica', 'normal');
                doc.text(datos.asientos.join(', '), 28, posY);
                posY += 5;
            }
        }

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

        posY += 2;
        doc.line(8, posY, 97, posY);
        posY += 5;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('TOTAL:', 8, posY);
        doc.text(`$${datos.montoTotal}`, 97, posY, { align: 'right' });


        posY += 4;
        const qrPosY = Math.min(posY, 72);
        doc.addImage(qrImageBase64, 'PNG', 31.25, qrPosY, 40, 40);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Presentá este QR en la entrada o el Candy', 52.5, qrPosY + 44, { align: 'center' });

        doc.save(`Ticket_${datos.idReserva}.pdf`);
    }
}