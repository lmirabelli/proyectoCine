export interface VentaPelicula {
    titulo: string;
    formatoYSala: string;
    cantidadEntradas: number;
    totalRecaudado: number;
}

export interface VentaProducto {
    nombreProducto: string;
    marca?: string;
    tamano?: string;
    cantidadVendida: number;
    totalRecaudado: number;
}

export interface DiaSelector {
    fechaIso: string;
    nombreDia: string;
    numeroDia: string;
    esHoy: boolean;
}