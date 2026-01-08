import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Legales } from './legales';

describe('Legales', () => {
  let component: Legales;
  let fixture: ComponentFixture<Legales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Legales]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Legales);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
