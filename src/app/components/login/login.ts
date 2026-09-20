import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.html',
    styleUrl: './login.css'
})
export class LoginComponent {
    private supabase = inject(SupabaseService);
    private router = inject(Router);

    loginEmail = signal<string>('');
    loginPassword = signal<string>('');

    regNombre = signal<string>('');
    regApellido = signal<string>('');
    regUsuario = signal<string>('');
    regEmail = signal<string>('');
    regPassword = signal<string>('');
    regFechaNacimiento = signal<string>('');
    regTipoSangre = signal<string>('A+');
    regColorOjos = signal<string>('');
    regDiasVacaciones = signal<number>(14);

    cargando = signal<boolean>(false);
    errorMensaje = signal<string | null>(null);
    exitoMensaje = signal<string | null>(null);

    async onLogin(): Promise<void> {
        if (!this.loginEmail() || !this.loginPassword()) {
            this.errorMensaje.set('Completá email y contraseña para ingresar.');
            return;
        }

        this.cargando.set(true);
        this.errorMensaje.set(null);
        this.exitoMensaje.set(null);

        try {
            const usuario = await this.supabase.iniciarSesion(
                this.loginEmail(),
                this.loginPassword()
            );

            if (usuario) {
                this.router.navigate(['/']);
            }
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            this.errorMensaje.set('Credenciales inválidas. Verificá los datos ingresados.');
        } finally {
            this.cargando.set(false);
        }
    }

    async onRegister(): Promise<void> {
        if (
            !this.regNombre() ||
            !this.regApellido() ||
            !this.regUsuario() ||
            !this.regEmail() ||
            !this.regPassword() ||
            !this.regFechaNacimiento() ||
            !this.regTipoSangre() ||
            !this.regColorOjos() ||
            this.regDiasVacaciones() === null
        ) {
            this.errorMensaje.set('Por favor, completá todos los campos para registrarte.');
            return;
        }

        this.cargando.set(true);
        this.errorMensaje.set(null);
        this.exitoMensaje.set(null);

        try {
            await this.supabase.registrarUsuario({
                nombre: this.regNombre(),
                apellido: this.regApellido(),
                usuario: this.regUsuario(),
                email: this.regEmail(),
                password: this.regPassword(),
                fecha_nacimiento: this.regFechaNacimiento(),
                tipo_sangre: this.regTipoSangre(),
                color_ojos: this.regColorOjos(),
                dias_vacaciones: this.regDiasVacaciones()
            });

            this.exitoMensaje.set('¡Registro exitoso! Ya podés iniciar sesión.');

            this.regNombre.set('');
            this.regApellido.set('');
            this.regUsuario.set('');
            this.regEmail.set('');
            this.regPassword.set('');
            this.regFechaNacimiento.set('');
            this.regTipoSangre.set('A+');
            this.regColorOjos.set('');
            this.regDiasVacaciones.set(14);
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            this.errorMensaje.set('No se pudo completar el registro. Intentalo de nuevo.');
        } finally {
            this.cargando.set(false);
        }
    }

    continuarComoInvitado(): void {
        this.supabase.usuarioActual.set(null);
        this.router.navigate(['/']);
    }
}