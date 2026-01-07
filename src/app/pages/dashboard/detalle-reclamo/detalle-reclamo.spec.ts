import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleReclamoComponent } from './detalle-reclamo';

describe('DetalleReclamo', () => {
  let component: DetalleReclamoComponent;
  let fixture: ComponentFixture<DetalleReclamoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleReclamoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalleReclamoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
