import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProcesoCompra } from './proceso-compra';

describe('ProcesoCompra', () => {
  let component: ProcesoCompra;
  let fixture: ComponentFixture<ProcesoCompra>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcesoCompra],
    }).compileComponents();

    fixture = TestBed.createComponent(ProcesoCompra);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
