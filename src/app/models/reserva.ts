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

export interface ReservaEntradasCache {
    peliculaId: string;
    tituloPelicula: string;
    funcionId: string;
    formato: string;
    idioma: string;
    cantidad: number;
    montoTotal: number;
    sala: string;
    fechaInicio: string;
    fechaReserva: string;
}

export interface ItemComprobante {
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    tamano: string;
    marca: string;
}

export interface Comprobante {
    id: string;
    codigo_reserva: string;
    estado: 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO';
    detalle_items: ItemComprobante[];
    monto_total: number;
    fecha_compra: string;
    fecha_canje?: string;
}