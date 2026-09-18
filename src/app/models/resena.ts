export interface Resena {
    id?: string;
    pelicula_id: string;
    usuario_id: string;
    estrellas: number;
    comentario: string;
    created_at?: string;
}