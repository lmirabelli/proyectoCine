import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DespachoCandy } from './despacho-candy';

describe('DespachoCandy', () => {
  let component: DespachoCandy;
  let fixture: ComponentFixture<DespachoCandy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DespachoCandy],
    }).compileComponents();

    fixture = TestBed.createComponent(DespachoCandy);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
