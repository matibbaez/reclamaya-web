import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerminosModal } from './terminos-modal';

describe('TerminosModal', () => {
  let component: TerminosModal;
  let fixture: ComponentFixture<TerminosModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerminosModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TerminosModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
