import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiSignature } from './ui-signature';

describe('UiSignature', () => {
  let component: UiSignature;
  let fixture: ComponentFixture<UiSignature>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiSignature]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UiSignature);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
