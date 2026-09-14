import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TarjetaPeliculaComponent } from './tarjeta-pelicula';

describe('TarjetaPelicula', () => {
  let component: TarjetaPeliculaComponent;
  let fixture: ComponentFixture<TarjetaPeliculaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaPeliculaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaPeliculaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
