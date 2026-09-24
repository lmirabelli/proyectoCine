import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

export const adminGuard: CanActivateFn = async () => {
    const supabase = inject(SupabaseService);
    const router = inject(Router);

    const esAdmin = await supabase.esAdministrador();
    if (esAdmin) return true;

    router.navigate(['/']);
    return false;
};

export const empleadoGuard: CanActivateFn = async () => {
    const supabase = inject(SupabaseService);
    const router = inject(Router);

    const tieneAcceso = await supabase.esEmpleado();
    if (tieneAcceso) return true;

    router.navigate(['/']);
    return false;
};