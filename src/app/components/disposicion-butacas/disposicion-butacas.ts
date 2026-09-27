import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from '../../services/supabase';
import { Butaca } from '../../models/butaca';

@Component({
  selector: 'app-disposicion-butacas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './disposicion-butacas.html',
  styleUrl: './disposicion-butacas.css'
})
export class DisposicionButacasComponent implements OnInit, OnChanges, OnDestroy {
  private supabase = inject(SupabaseService);
  private canalRealtime: RealtimeChannel | null = null;

  @Input() funcionId!: string;
  @Input() salaId!: string;
  @Input() cantidadMaxSeleccionable: number = 1;
  @Output() seleccionCambiada = new EventEmitter<Butaca[]>();

  filas: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
  mapaFilas = signal<{ fila: string; esEspecial: boolean; bloques: Butaca[][] }[]>([]);
  butacasSeleccionadas = signal<Butaca[]>([]);

  async ngOnInit(): Promise<void> {
    await this.generarMapaYObtenerOcupadas();
    this.suscribirRealtime();
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if ((changes['funcionId'] || changes['salaId']) && !changes['funcionId']?.firstChange) {
      this.butacasSeleccionadas.set([]);
      this.seleccionCambiada.emit([]);
      await this.generarMapaYObtenerOcupadas();
      this.suscribirRealtime();
    }
  }

  ngOnDestroy(): void {
    this.desuscribirRealtime();
  }

  private suscribirRealtime(): void {
    this.desuscribirRealtime();

    if (!this.funcionId) return;

    this.canalRealtime = this.supabase.client
      .channel(`realtime-butacas-${this.funcionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'entradas_reservadas',
          filter: `funcion_id=eq.${this.funcionId}`
        },
        (payload) => {
          const asientoReservado = payload.new['asiento'];
          if (asientoReservado) {
            this.marcarAsientoComoOcupadoRealtime(asientoReservado);
          }
        }
      )
      .subscribe();
  }

  private desuscribirRealtime(): void {
    if (this.canalRealtime) {
      this.supabase.client.removeChannel(this.canalRealtime);
      this.canalRealtime = null;
    }
  }

  private marcarAsientoComoOcupadoRealtime(asientoId: string): void {
    this.mapaFilas.update((mapaActual) =>
      mapaActual.map((f) => ({
        ...f,
        bloques: f.bloques.map((bloque) =>
          bloque.map((b) => {
            if (b.id === asientoId) {
              return { ...b, ocupada: true, seleccionada: false };
            }
            return b;
          })
        )
      }))
    );

    const seleccionadas = this.butacasSeleccionadas();
    if (seleccionadas.some((b) => b.id === asientoId)) {
      const nuevasSeleccionadas = seleccionadas.filter((b) => b.id !== asientoId);
      this.butacasSeleccionadas.set(nuevasSeleccionadas);
      this.seleccionCambiada.emit(nuevasSeleccionadas);
    }
  }

  async generarMapaYObtenerOcupadas(): Promise<void> {
    const asientosOcupados = await this.obtenerAsientosOcupados();

    const mapaGenerado = this.filas.map((fila) => {
      const esEspecial = fila === 'J' || fila === 'K';

      const bloque1 = this.crearBloque(fila, 1, 2, esEspecial, 1, asientosOcupados);
      const bloque2 = this.crearBloque(fila, 3, 12, esEspecial, 2, asientosOcupados);
      const bloque3 = this.crearBloque(fila, 13, 14, esEspecial, 3, asientosOcupados);

      return {
        fila,
        esEspecial,
        bloques: [bloque1, bloque2, bloque3]
      };
    });

    this.mapaFilas.set(mapaGenerado);
  }

  private async obtenerAsientosOcupados(): Promise<string[]> {
    if (!this.funcionId) return [];

    try {
      let query = this.supabase.client
        .from('entradas_reservadas')
        .select('asiento')
        .eq('funcion_id', this.funcionId);

      if (this.salaId) {
        query = query.eq('sala_id', this.salaId);
      }

      const { data, error } = await query;

      if (error || !data) return [];
      return data.map((d: any) => d.asiento);
    } catch {
      return [];
    }
  }

  private crearBloque(
    fila: string,
    inicio: number,
    fin: number,
    esAccesible: boolean,
    bloqueIndex: number,
    asientosOcupados: string[]
  ): Butaca[] {
    const bloque: Butaca[] = [];
    for (let i = inicio; i <= fin; i++) {
      const id = `${fila}-${i}`;
      bloque.push({
        id,
        fila,
        numero: i,
        esAccesible,
        bloque: bloqueIndex,
        ocupada: asientosOcupados.includes(id),
        seleccionada: false
      });
    }
    return bloque;
  }

  seleccionarButaca(butaca: Butaca): void {
    if (butaca.ocupada) return;

    const seleccionadas = [...this.butacasSeleccionadas()];
    const index = seleccionadas.findIndex((b) => b.id === butaca.id);

    if (index >= 0) {
      seleccionadas.splice(index, 1);
      butaca.seleccionada = false;
    } else {
      if (seleccionadas.length >= this.cantidadMaxSeleccionable) {
        const removida = seleccionadas.shift();
        if (removida) removida.seleccionada = false;
      }
      butaca.seleccionada = true;
      seleccionadas.push(butaca);
    }

    this.butacasSeleccionadas.set(seleccionadas);
    this.seleccionCambiada.emit(seleccionadas);
  }
}