import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Destacados } from './destacados';

describe('Destacados', () => {
  let component: Destacados;
  let fixture: ComponentFixture<Destacados>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Destacados],
    }).compileComponents();

    fixture = TestBed.createComponent(Destacados);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
