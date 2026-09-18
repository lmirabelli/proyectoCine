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
            pelicula: datos.tituloPelicula,
            formato: datos.formato,
            idioma: datos.idioma,
            asientos: datos.asientos
        });
        const qrImageBase64 = await QRCode.toDataURL(qrData, { margin: 1 });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('COMPROBANTE DE COMPRA', 52.5, 15, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Reserva #: ${datos.idReserva}`, 52.5, 22, { align: 'center' });

        doc.setLineWidth(0.5);
        doc.line(10, 26, 95, 26);

        doc.setFont('helvetica', 'bold');
        doc.text('Película:', 10, 34);
        doc.setFont('helvetica', 'normal');
        doc.text(datos.tituloPelicula, 30, 34);

        doc.setFont('helvetica', 'bold');
        doc.text('Formato:', 10, 42);
        doc.setFont('helvetica', 'normal');
        doc.text(`${datos.formato} - ${datos.idioma}`, 30, 42);

        doc.setFont('helvetica', 'bold');
        doc.text('Asientos:', 10, 50);
        doc.setFont('helvetica', 'normal');
        doc.text(datos.asientos.join(', '), 30, 50);

        doc.setFont('helvetica', 'bold');
        doc.text('Total Paid:', 10, 58);
        doc.setFont('helvetica', 'normal');
        doc.text(`$${datos.montoTotal}`, 30, 58);

        doc.line(10, 63, 95, 63);

        doc.addImage(qrImageBase64, 'PNG', 28.75, 67, 45, 45);

        doc.setFontSize(8);
        doc.text('Escanear en el ingreso a la sala', 52.5, 117, { align: 'center' });

        doc.save(`Ticket_${datos.idReserva}.pdf`);
    }
}