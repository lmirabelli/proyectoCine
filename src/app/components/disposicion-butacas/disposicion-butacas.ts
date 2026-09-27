import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase';
import { Butaca } from '../../models/butaca';

@Component({
  selector: 'app-disposicion-butacas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './disposicion-butacas.html',
  styleUrl: './disposicion-butacas.css'
})
export class DisposicionButacasComponent implements OnInit, OnChanges {
  private supabase = inject(SupabaseService);

  @Input() funcionId!: string;
  @Input() salaId!: string;
  @Input() cantidadMaxSeleccionable: number = 1;
  @Output() seleccionCambiada = new EventEmitter<Butaca[]>();

  filas: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
  mapaFilas = signal<{ fila: string; esEspecial: boolean; bloques: Butaca[][] }[]>([]);
  butacasSeleccionadas = signal<Butaca[]>([]);

  async ngOnInit(): Promise<void> {
    await this.generarMapaYObtenerOcupadas();
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if ((changes['funcionId'] || changes['salaId']) && !changes['funcionId']?.firstChange) {
      this.butacasSeleccionadas.set([]);
      this.seleccionCambiada.emit([]);
      await this.generarMapaYObtenerOcupadas();
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