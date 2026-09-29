import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { ComprobanteReserva } from '../models/reserva';

@Injectable({
    providedIn: 'root'
})
export class PdfService {

    async generarComprobantePDF(datos: ComprobanteReserva): Promise<void> {
        const esPagoConPuntos = datos.idReserva.startsWith('CANJ');
        const multiplicadorPuntos = 20;

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

        // ----------------------------------------------------- ENCABEZADO 
        doc.setFont('helvetica', 'bolditalic');
        doc.setFontSize(14);
        doc.text('SALAS DE CINE - PUCHITO PUCHITO', 52.5, posY, { align: 'center' });
        posY += 12;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        const tituloComprobante = esPagoConPuntos ? 'COMPROBANTE DE CANJE' : 'COMPROBANTE DE COMPRA';
        doc.text(tituloComprobante, 52.5, posY, { align: 'center' });
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

            const cantEntradas = datos.cantidadEntradas ?? 0;
            doc.setFont('helvetica', 'bold');
            doc.text('Cant. Entradas:', 8, posY);
            doc.setFont('helvetica', 'normal');

            // Lógica según tipo de pago
            if (esPagoConPuntos) {
                // Estimación o desglose del gasto de entradas en puntos si las hay
                const costoEntradasPesos = (datos.montoTotal - (datos.itemsCandy?.reduce((acc, i) => acc + i.subtotal, 0) ?? 0));
                const costoEntradasPts = Math.max(0, Math.ceil(costoEntradasPesos * multiplicadorPuntos));
                doc.text(`${cantEntradas}x entradas ${costoEntradasPts}pts`, 32, posY);
            } else {
                const costoEntradasPesos = (datos.montoTotal - (datos.itemsCandy?.reduce((acc, i) => acc + i.subtotal, 0) ?? 0));
                doc.text(`${cantEntradas}x entradas $${Math.max(0, costoEntradasPesos)}`, 32, posY);
            }
            posY += 5;

            if (datos.requiereAdulto) {
                posY += 2;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(200, 0, 0);
                doc.text('* Debe asistir acompañado por un adulto *', 52.5, posY, { align: 'center' });
                doc.setTextColor(0, 0, 0);
                posY += 5;
            }
        }

        // ----------------------------------------------------------- CANDY
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
                const precio = esPagoConPuntos 
                    ? `${Math.ceil(item.subtotal * multiplicadorPuntos)}pts`
                    : `$${item.subtotal}`;
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

        const totalTexto = esPagoConPuntos
            ? `${Math.ceil(datos.montoTotal * multiplicadorPuntos)}pts`
            : `$${datos.montoTotal}`;

        doc.text(totalTexto, 97, posY, { align: 'right' });

        posY += 6;
        const qrPosY = Math.min(posY, 90);
        doc.addImage(qrImageBase64, 'PNG', 34, qrPosY, 35, 35);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Presentá este QR en la entrada o el Candy', 52.5, qrPosY + 39, { align: 'center' });

        doc.save(`Ticket_${datos.idReserva}.pdf`);
    }
}