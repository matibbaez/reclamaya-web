import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisReferidos } from './mis-referidos';

describe('MisReferidos', () => {
  let component: MisReferidos;
  let fixture: ComponentFixture<MisReferidos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisReferidos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MisReferidos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
