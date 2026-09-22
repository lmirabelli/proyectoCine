export interface ItemCandyPDF {
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
}

export interface ComprobanteReserva {
    idReserva: string;
    montoTotal: number;
    fechaCompra: string;
    codigoQR: string;

    peliculaId?: string;
    tituloPelicula?: string;
    formato?: string;
    idioma?: string;
    sala?: string;
    fechaInicio?: string;
    cantidadEntradas?: number;
    asientos?: string[];

    itemsCandy?: ItemCandyPDF[];
}