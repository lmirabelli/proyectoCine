import { Component, inject } from '@angular/core';
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

    irAlLogin(): void {
        this.router.navigate(['/login']);
    }

    cerrarSesion(): void {
        this.supabase.cerrarSesion();
        this.router.navigate(['/']);
    }
}