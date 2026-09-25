export interface Cupon {
    id: string;
    codigo: string;
    descuento: number;
    disponible: number;
    fecha_creacion?: string;
}

export interface DescuentoRegla {
    id: string;
    nombre: string;
    edad_minima: number;
    porcentaje: number;
    tope_maximo: number;
}