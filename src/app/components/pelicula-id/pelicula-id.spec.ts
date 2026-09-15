import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PeliculaId } from './pelicula-id';

describe('PeliculaId', () => {
  let component: PeliculaId;
  let fixture: ComponentFixture<PeliculaId>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeliculaId],
    }).compileComponents();

    fixture = TestBed.createComponent(PeliculaId);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
