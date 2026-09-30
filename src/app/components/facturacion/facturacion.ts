import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { GraficosComponent } from '../graficos/graficos';
import { DiaSelector, VentaPelicula, VentaProducto } from '../../models/facturacion';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [CommonModule, GraficosComponent],
  templateUrl: './facturacion.html',
  styleUrl: './facturacion.css'
})
export class Facturacion implements OnInit {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  esAdmin = signal<boolean>(false);
  cargando = signal<boolean>(true);

  diasDisponibles = signal<DiaSelector[]>([]);
  fechaSeleccionadaIso = signal<string>('');

  ventasPeliculas = signal<VentaPelicula[]>([]);
  ventasCandy = signal<VentaProducto[]>([]);

  totalEntradasVendidas = computed(() => 
    this.ventasPeliculas().reduce((acc, item) => acc + item.cantidadEntradas, 0)
  );
  
  totalFacturadoEntradas = computed(() => 
    this.ventasPeliculas().reduce((acc, item) => acc + item.totalRecaudado, 0)
  );

  totalProductosCandyVendidos = computed(() => 
    this.ventasCandy().reduce((acc, item) => acc + item.cantidadVendida, 0)
  );

  totalFacturadoCandy = computed(() => 
    this.ventasCandy().reduce((acc, item) => acc + item.totalRecaudado, 0)
  );

  totalFacturadoDiarioGeneral = computed(() => 
    this.totalFacturadoEntradas() + this.totalFacturadoCandy()
  );

  async ngOnInit(): Promise<void> {
    const esAdministrador = await this.supabase.esAdministrador();
    if (!esAdministrador) {
      Swal.fire({
        icon: 'error',
        title: 'Acceso Denegado',
        text: 'Solo administradores pueden ver la facturación.'
      });
      this.router.navigate(['/']);
      return;
    }
    this.esAdmin.set(true);

    this.generarUltimos7Dias();
    await this.cargarReporteDiario();
  }

  private generarUltimos7Dias(): void {
    const listaDias: DiaSelector[] = [];
    const hoyObj = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(hoyObj.getDate() - i);

      const iso = d.toISOString().split('T')[0];
      const esHoy = i === 0;

      let nombreDia = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
      if (esHoy) nombreDia = 'Hoy';

      listaDias.push({
        fechaIso: iso,
        nombreDia: nombreDia.toUpperCase(),
        numeroDia: d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        esHoy
      });
    }

    this.diasDisponibles.set(listaDias);
    this.fechaSeleccionadaIso.set(listaDias[6].fechaIso);
  }

  async seleccionarDia(fechaIso: string): Promise<void> {
    this.fechaSeleccionadaIso.set(fechaIso);
    await this.cargarReporteDiario();
  }

  async cargarReporteDiario(): Promise<void> {
    this.cargando.set(true);
    const fecha = this.fechaSeleccionadaIso();

    const inicioDia = `${fecha}T00:00:00.000Z`;
    const finDia = `${fecha}T23:59:59.999Z`;

    try {
      const { data: comprobantesData, error } = await this.supabase.client
        .from('comprobantes')
        .select('*')
        .gte('fecha_compra', inicioDia)
        .lte('fecha_compra', finDia);

      if (error) {
        console.error('Error al obtener comprobantes:', error);
        return;
      }

      const mapaPeliculas = new Map<string, VentaPelicula>();
      const mapaCandy = new Map<string, VentaProducto>();

      if (comprobantesData) {
        comprobantesData.forEach((comp: any) => {
          const items = comp.detalle_items;
          
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              const nombreRaw: string = item.nombre || '';
              const cantidad: number = item.cantidad || 1;
              const precioUnitario: number = item.precioUnitario || 0;
              const subtotal = precioUnitario * cantidad;

              if (nombreRaw.startsWith('Entrada:')) {
                const infoLimpia = nombreRaw.replace('Entrada:', '').trim(); 

                let titulo = infoLimpia;
                let formatoYSala = 'General';

                const matchParentesis = infoLimpia.match(/^(.*)\((.*)\)$/);
                if (matchParentesis) {
                  titulo = matchParentesis[1].trim();
                  formatoYSala = matchParentesis[2].trim();
                }

                const clavePelicula = `${titulo}_${formatoYSala}`;

                const actual = mapaPeliculas.get(clavePelicula) || {
                  titulo,
                  formatoYSala,
                  cantidadEntradas: 0,
                  totalRecaudado: 0
                };

                actual.cantidadEntradas += cantidad;
                actual.totalRecaudado += subtotal;

                mapaPeliculas.set(clavePelicula, actual);

              } else {
                const nombreProd = item.nombre || 'Producto Candy';
                const marca = item.marca ? ` (${item.marca})` : '';
                const tamano = item.tamano ? ` - ${item.tamano}` : '';
                const claveCandy = `${nombreProd}${marca}${tamano}`;

                const actual = mapaCandy.get(claveCandy) || {
                  nombreProducto: claveCandy,
                  cantidadVendida: 0,
                  totalRecaudado: 0
                };

                actual.cantidadVendida += cantidad;
                actual.totalRecaudado += subtotal;

                mapaCandy.set(claveCandy, actual);
              }
            });
          }
        });
      }

      this.ventasPeliculas.set(Array.from(mapaPeliculas.values()));
      this.ventasCandy.set(Array.from(mapaCandy.values()));

    } catch (err) {
      console.error('Error al cargar reporte de facturación:', err);
    } finally {
      this.cargando.set(false);
    }
  }
}