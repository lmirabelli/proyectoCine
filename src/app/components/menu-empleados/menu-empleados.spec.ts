import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuEmpleados } from './menu-empleados';

describe('MenuEmpleados', () => {
  let component: MenuEmpleados;
  let fixture: ComponentFixture<MenuEmpleados>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuEmpleados],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuEmpleados);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
