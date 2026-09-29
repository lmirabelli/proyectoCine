import { Component, inject, signal, computed } from '@angular/core';
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
    regDia = signal<string>('');
    regMes = signal<string>('');
    regAnio = signal<string>('');
    regTipoSangre = signal<string>('A+');
    regColorOjos = signal<string>('');
    regDiasVacaciones = signal<number>(14);
    cargando = signal<boolean>(false);
    errorMensaje = signal<string | null>(null);
    exitoMensaje = signal<string | null>(null);
    touched = signal<Record<string, boolean>>({});

    dias = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    meses = [
        { valor: '01', nombre: 'Enero' },
        { valor: '02', nombre: 'Febrero' },
        { valor: '03', nombre: 'Marzo' },
        { valor: '04', nombre: 'Abril' },
        { valor: '05', nombre: 'Mayo' },
        { valor: '06', nombre: 'Junio' },
        { valor: '07', nombre: 'Julio' },
        { valor: '08', nombre: 'Agosto' },
        { valor: '09', nombre: 'Septiembre' },
        { valor: '10', nombre: 'Octubre' },
        { valor: '11', nombre: 'Noviembre' },
        { valor: '12', nombre: 'Diciembre' }
    ];
    anios = Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => (new Date().getFullYear() - i).toString());

    valEmailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    errLoginEmail = computed(() => {
        if (!this.loginEmail()) return 'El email es requerido';
        if (!this.valEmailPattern.test(this.loginEmail())) return 'Formato de email inválido';
        return null;
    });

    errLoginPassword = computed(() => {
        if (!this.loginPassword()) return 'La contraseña es requerida';
        return null;
    });

    errRegNombre = computed(() => !this.regNombre().trim() ? 'El nombre es requerido' : null);
    errRegApellido = computed(() => !this.regApellido().trim() ? 'El apellido es requerido' : null);
    errRegUsuario = computed(() => !this.regUsuario().trim() ? 'El usuario es requerido' : null);

    errRegEmail = computed(() => {
        if (!this.regEmail()) return 'El email es requerido';
        if (!this.valEmailPattern.test(this.regEmail())) return 'Formato de email inválido';
        return null;
    });

    errRegPassword = computed(() => {
        if (!this.regPassword()) return 'La contraseña es requerida';
        if (this.regPassword().length < 6) return 'Mínimo 6 caracteres';
        return null;
    });

    errRegFecha = computed(() => {
        if (!this.regDia() || !this.regMes() || !this.regAnio()) return 'Selecciona día, mes y año';
        return null;
    });

    errRegColorOjos = computed(() => !this.regColorOjos().trim() ? 'Especifica un color de ojos' : null);
    errRegVacaciones = computed(() => (this.regDiasVacaciones() === null || this.regDiasVacaciones() < 0) ? 'Número inválido' : null);

    regFormValido = computed(() => {
        return !this.errRegNombre() &&
            !this.errRegApellido() &&
            !this.errRegUsuario() &&
            !this.errRegEmail() &&
            !this.errRegPassword() &&
            !this.errRegFecha() &&
            !this.errRegColorOjos() &&
            !this.errRegVacaciones();
    });

    regFechaNacimiento = computed(() => {
        if (!this.regDia() || !this.regMes() || !this.regAnio()) return '';
        return `${this.regAnio()}-${this.regMes()}-${this.regDia()}`;
    });

    marcarTocado(campo: string): void {
        this.touched.update(t => ({ ...t, [campo]: true }));
    }

    async onLogin(): Promise<void> {
        this.marcarTocado('loginEmail');
        this.marcarTocado('loginPassword');

        if (this.errLoginEmail() || this.errLoginPassword()) {
            this.errorMensaje.set('Por favor corregí los errores antes de ingresar.');
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
        ['regNombre', 'regApellido', 'regUsuario', 'regEmail', 'regPassword', 'regFecha', 'regColorOjos', 'regVacaciones']
            .forEach(c => this.marcarTocado(c));

        if (!this.regFormValido()) {
            this.errorMensaje.set('Por favor, completá correctamente todos los campos.');
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
            this.regDia.set('');
            this.regMes.set('');
            this.regAnio.set('');
            this.regTipoSangre.set('A+');
            this.regColorOjos.set('');
            this.regDiasVacaciones.set(14);
            this.touched.set({});
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