export type FormatoProyeccion = '2D' | '3D' | '4D' | '5D';
export type IdiomaProyeccion = 'Castellano' | 'Subtitulada';

export interface SeleccionEntrada {
    peliculaId: string;
    tituloPelicula: string;
    formato: FormatoProyeccion;
    idioma: IdiomaProyeccion;
    montoTotal: number;
    asientos: string[];
}

export interface ComprobanteReserva extends SeleccionEntrada {
    idReserva: string;
    fechaCompra: string;
    codigoQR: string;
}