export interface Butaca {
    id: string;
    fila: string;
    numero: number;
    esAccesible: boolean;
    bloque: number;
    ocupada?: boolean;
    seleccionada?: boolean;
}