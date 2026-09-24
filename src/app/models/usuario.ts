export interface Usuario {
    id?: string;
    nombre?: string;
    apellido?: string;
    usuario: string;
    email?: string;
    password?: string;
    fecha_nacimiento?: string;
    created_at?: string;
    rol?: 'admin' | 'empleado' | 'cliente';
}