import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';
import { Usuario } from '../../models/usuario';

interface UsuarioEdicion extends Usuario {
  rolOriginal?: 'administrador' | 'empleado' | 'cliente';
  modificado?: boolean;
}

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-usuarios.html',
  styleUrl: './gestion-usuarios.css'
})
export class GestionUsuariosComponent implements OnInit {
  private supabase = inject(SupabaseService);

  esAdmin = signal<boolean>(false);
  cargando = signal<boolean>(true);
  procesandoId = signal<string | null>(null);

  usuarios = signal<UsuarioEdicion[]>([]);
  rolesDisponibles: ('administrador' | 'empleado' | 'cliente')[] = ['cliente', 'empleado', 'administrador'];

  async ngOnInit(): Promise<void> {
    await this.verificarAcceso();
  }

  private async verificarAcceso(): Promise<void> {
    this.cargando.set(true);
    const esAdministrador = await this.supabase.esAdministrador();
    this.esAdmin.set(esAdministrador);

    if (esAdministrador) {
      await this.cargarUsuarios();
    }
    this.cargando.set(false);
  }

  async cargarUsuarios(): Promise<void> {
    try {
      const { data, error } = await this.supabase.client
        .from('perfiles')
        .select('id, nombre, apellido, email, usuario, rol')
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error al obtener la tabla perfiles:', error);
      } else if (data) {
        const usuariosConEstado: UsuarioEdicion[] = data.map((u: any) => ({
          ...u,
          rolOriginal: u.rol,
          modificado: false
        }));
        this.usuarios.set(usuariosConEstado);
      }
    } catch (err) {
      console.error('Error inesperado al cargar perfiles:', err);
    }
  }

  onSeleccionarRol(usuario: UsuarioEdicion, nuevoRol: 'administrador' | 'empleado' | 'cliente'): void {
    usuario.rol = nuevoRol;
    usuario.modificado = usuario.rol !== usuario.rolOriginal;
  }

  async guardarRol(usuario: UsuarioEdicion): Promise<void> {
    if (!usuario.id || !usuario.modificado) return;

    this.procesandoId.set(usuario.id);
    try {
      const { error } = await this.supabase.client
        .from('perfiles')
        .update({ rol: usuario.rol })
        .eq('id', usuario.id);

      if (error) {
        alert('Error al guardar el rol en Supabase: ' + error.message);
      } else {
        usuario.rolOriginal = usuario.rol;
        usuario.modificado = false;
        alert('Rol actualizado exitosamente.');
      }
    } finally {
      this.procesandoId.set(null);
    }
  }

  async eliminarPerfil(usuario: UsuarioEdicion): Promise<void> {
    if (!usuario.id) return;

    const confirmacion = confirm(
      `¿Desea eliminar el perfil de ${usuario.nombre ?? ''} ${usuario.apellido ?? ''} (@${usuario.usuario})?`
    );

    if (!confirmacion) return;

    this.procesandoId.set(usuario.id);
    try {
      const { error } = await this.supabase.client
        .from('perfiles')
        .delete()
        .eq('id', usuario.id);

      if (error) {
        alert('Error al borrar el perfil: ' + error.message);
      } else {
        this.usuarios.set(this.usuarios().filter(u => u.id !== usuario.id));
      }
    } finally {
      this.procesandoId.set(null);
    }
  }
}