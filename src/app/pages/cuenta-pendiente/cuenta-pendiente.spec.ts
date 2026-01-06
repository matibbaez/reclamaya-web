import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuentaPendiente } from './cuenta-pendiente';

describe('CuentaPendiente', () => {
  let component: CuentaPendiente;
  let fixture: ComponentFixture<CuentaPendiente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuentaPendiente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CuentaPendiente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
