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