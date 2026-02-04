import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingProductoresComponent } from './landing-productores';

describe('LandingProductores', () => {
  let component: LandingProductoresComponent;
  let fixture: ComponentFixture<LandingProductoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingProductoresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandingProductoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
