import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './navbar.html',
    styleUrl: './navbar.css'
})
export class NavbarComponent {
    private supabase = inject(SupabaseService);
    private router = inject(Router);

    usuario = this.supabase.usuarioActual;
    esAdmin = signal<boolean>(false);
    esPersonal = signal<boolean>(false);

    constructor() {
    effect(async () => {
        const user = this.usuario();
        if (user) {
            const esAdmin = await this.supabase.esAdministrador();
            const esEmpleado = await this.supabase.esEmpleado();

            this.esPersonal.set(esAdmin || esEmpleado);
        } else {
            this.esPersonal.set(false);
        }
    });
}

irAlMenuEmpleados(): void {
    this.router.navigate(['/menu-empleados']);
}
    

    irAlLogin(): void {
        this.router.navigate(['/login']);
    }

    irAlPanelAdmin(): void {
        this.router.navigate(['/panelAdministrador']);
    }
    esRutaCandy(): boolean {
        return this.router.url === '/candybar';
    }

    irAlCandy(): void {
        this.supabase.irAlCandy();
    }

    async cerrarSesion(): Promise<void> {
        await this.supabase.cerrarSesion();
        this.esAdmin.set(false);
        this.router.navigate(['/']);
    }
}