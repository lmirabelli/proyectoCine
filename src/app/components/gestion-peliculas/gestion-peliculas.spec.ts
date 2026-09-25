import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestionPeliculas } from './gestion-peliculas';

describe('GestionPeliculas', () => {
  let component: GestionPeliculas;
  let fixture: ComponentFixture<GestionPeliculas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionPeliculas],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionPeliculas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
