import { Component, OnInit, ElementRef, ViewChild, inject, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

type TipoGrafico = 'ventas_semana' | 'ventas_mes_peliculas' | 'candy_mes';

interface ItemDetalle {
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    marca?: string;
    tamano?: string;
}

@Component({
    selector: 'app-graficos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './graficos.html',
    styleUrl: './graficos.css'
})
export class GraficosComponent implements OnInit, AfterViewInit {
    private supabase = inject(SupabaseService);

    @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
    private chartInstance: Chart | null = null;

    tipoSeleccionado = signal<TipoGrafico>('ventas_semana');
    cargando = signal<boolean>(false);

    ngOnInit(): void {}

    ngAfterViewInit(): void {
        this.cargarGrafico();
    }

    async cambiarTipo(nuevoTipo: TipoGrafico): Promise<void> {
        this.tipoSeleccionado.set(nuevoTipo);
        await this.cargarGrafico();
    }

    async cargarGrafico(): Promise<void> {
        this.cargando.set(true);

        // Limpiar siempre la instancia previa para evitar que quede congelado el gráfico anterior
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }

        try {
            switch (this.tipoSeleccionado()) {
                case 'ventas_semana':
                    await this.generarGraficoVentasSemana();
                    break;
                case 'ventas_mes_peliculas':
                    await this.generarGraficoVentasMesPeliculas();
                    break;
                case 'candy_mes':
                    await this.generarGraficoCandyMes();
                    break;
            }
        } catch (error) {
            console.error('Error al cargar datos del gráfico:', error);
        } finally {
            this.cargando.set(false);
        }
    }

private async generarGraficoVentasSemana(): Promise<void> {
    const haceUnaSemana = new Date();
    haceUnaSemana.setDate(haceUnaSemana.getDate() - 7);

    const { data, error } = await this.supabase.client
        .from('comprobantes')
        .select('fecha_compra, detalle_items')
        .gte('fecha_compra', haceUnaSemana.toISOString());

    if (error) throw error;

    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    // Crear la lista ordenada con las etiquetas de los últimos 7 días
    const labelsDias: string[] = [];
    const mapaDiasIndices: { [key: string]: number } = {};

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const nombreDia = diasSemana[d.getDay()];
        labelsDias.push(nombreDia);
        mapaDiasIndices[nombreDia] = 6 - i; // Índice del día (0 a 6)
    }

    // Estructura para agrupar ventas: { "el 5 de talleres": [0, 0, 3, 1, 0, 0, 0], ... }
    const ventasPorPelicula: { [pelicula: string]: number[] } = {};

    (data || []).forEach(comp => {
        if (!comp.fecha_compra || !Array.isArray(comp.detalle_items)) return;

        const fecha = new Date(comp.fecha_compra);
        const nombreDia = diasSemana[fecha.getDay()];
        const idxDia = mapaDiasIndices[nombreDia];

        if (idxDia === undefined) return;

        comp.detalle_items.forEach((item: ItemDetalle) => {
            if (item.nombre && item.nombre.toLowerCase().startsWith('entrada:')) {
                // Limpiar nombre de la película
                let tituloClean = item.nombre.replace(/^Entrada:\s*/i, '');
                if (tituloClean.includes('(')) {
                    tituloClean = tituloClean.split('(')[0].trim();
                }

                // Si es la primera vez que la vemos, inicializamos su array de 7 días en 0
                if (!ventasPorPelicula[tituloClean]) {
                    ventasPorPelicula[tituloClean] = new Array(7).fill(0);
                }

                ventasPorPelicula[tituloClean][idxDia] += item.cantidad || 1;
            }
        });
    });

    const colores = [
        { border: 'rgba(255, 99, 132, 1)', bg: 'rgba(255, 99, 132, 0.2)' },
        { border: 'rgba(54, 162, 235, 1)', bg: 'rgba(54, 162, 235, 0.2)' },
        { border: 'rgba(255, 206, 86, 1)', bg: 'rgba(255, 206, 86, 0.2)' },
        { border: 'rgba(75, 192, 192, 1)', bg: 'rgba(75, 192, 192, 0.2)' },
        { border: 'rgba(153, 102, 255, 1)', bg: 'rgba(153, 102, 255, 0.2)' }
    ];

    const datasets = Object.keys(ventasPorPelicula).map((pelicula, index) => {
        const color = colores[index % colores.length];
        return {
            label: pelicula,
            data: ventasPorPelicula[pelicula],
            borderColor: color.border,
            backgroundColor: color.bg,
            borderWidth: 2,
            fill: false,
            tension: 0.3
        };
    });

    this.renderizarChart('line', labelsDias, datasets);
}

    private async generarGraficoVentasMesPeliculas(): Promise<void> {
        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);

        const { data, error } = await this.supabase.client
            .from('comprobantes')
            .select('fecha_compra, detalle_items')
            .gte('fecha_compra', inicioMes.toISOString());

        if (error) throw error;

        const conteoPeliculas: { [titulo: string]: number } = {};

        (data || []).forEach(comp => {
            if (!Array.isArray(comp.detalle_items)) return;

            comp.detalle_items.forEach((item: ItemDetalle) => {
                if (item.nombre && item.nombre.toLowerCase().startsWith('entrada:')) {
                    let tituloClean = item.nombre.replace(/^Entrada:\s*/i, '');
                    if (tituloClean.includes('(')) {
                        tituloClean = tituloClean.split('(')[0].trim();
                    }

                    conteoPeliculas[tituloClean] = (conteoPeliculas[tituloClean] || 0) + (item.cantidad || 1);
                }
            });
        });

        this.renderizarChart(
            'bar',
            Object.keys(conteoPeliculas),
            [{
                label: 'Entradas por Película (Mes)',
                data: Object.values(conteoPeliculas),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)'
                ],
                borderColor: 'rgba(255, 255, 255, 0.8)',
                borderWidth: 1
            }]
        );
    }

    private async generarGraficoCandyMes(): Promise<void> {
        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);

        const { data, error } = await this.supabase.client
            .from('comprobantes')
            .select('fecha_compra, detalle_items')
            .gte('fecha_compra', inicioMes.toISOString());

        if (error) throw error;

        const conteoCandy: { [producto: string]: number } = {};

        (data || []).forEach(comp => {
            if (!Array.isArray(comp.detalle_items)) return;

            comp.detalle_items.forEach((item: ItemDetalle) => {
                if (item.nombre && !item.nombre.toLowerCase().startsWith('entrada:')) {
                    const nombreProducto = item.tamano 
                        ? `${item.nombre} (${item.tamano})` 
                        : item.nombre;

                    conteoCandy[nombreProducto] = (conteoCandy[nombreProducto] || 0) + (item.cantidad || 1);
                }
            });
        });

        this.renderizarChart(
            'doughnut',
            Object.keys(conteoCandy),
            [{
                label: 'Unidades Vendidas',
                data: Object.values(conteoCandy),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ]
            }]
        );
    }

    private renderizarChart(type: any, labels: string[], datasets: any[]): void {
        if (!this.chartCanvas) return;

        this.chartInstance = new Chart(this.chartCanvas.nativeElement, {
            type: type,
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                },
                scales: type !== 'doughnut' ? {
                    x: { ticks: { color: '#ffffff' } },
                    y: { ticks: { color: '#ffffff' }, beginAtZero: true }
                } : {}
            }
        });
    }
}