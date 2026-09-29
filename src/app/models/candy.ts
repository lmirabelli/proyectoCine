export interface ProductoCandy {
    id: string;
    producto: string;
    tamano?: string;
    marca?: string;
    precio: number;
    categoria?: string;
}

export interface ItemCarrito {
    producto: ProductoCandy;
    cantidad: number;
}

export interface ItemCandySeleccion {
    id: number;
    producto: string;
    cantidad: number;
    marca: string;
    tamano: string
}