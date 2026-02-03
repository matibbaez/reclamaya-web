import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingProductores } from './landing-productores';

describe('LandingProductores', () => {
  let component: LandingProductores;
  let fixture: ComponentFixture<LandingProductores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingProductores]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandingProductores);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
