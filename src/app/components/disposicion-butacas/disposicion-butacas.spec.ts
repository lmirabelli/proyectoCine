import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DisposicionButacas } from './disposicion-butacas';

describe('DisposicionButacas', () => {
  let component: DisposicionButacas;
  let fixture: ComponentFixture<DisposicionButacas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisposicionButacas],
    }).compileComponents();

    fixture = TestBed.createComponent(DisposicionButacas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
