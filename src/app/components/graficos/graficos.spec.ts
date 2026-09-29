import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Graficos } from './graficos';

describe('Graficos', () => {
  let component: Graficos;
  let fixture: ComponentFixture<Graficos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Graficos],
    }).compileComponents();

    fixture = TestBed.createComponent(Graficos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
