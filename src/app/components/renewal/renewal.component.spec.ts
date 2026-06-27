import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenewalComponent } from './renewal.component';

describe('RenewalComponent', () => {
  let component: RenewalComponent;
  let fixture: ComponentFixture<RenewalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RenewalComponent]
    });
    fixture = TestBed.createComponent(RenewalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
