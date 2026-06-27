import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OneMonthRenewComponent } from './one-month-renew.component';

describe('OneMonthRenewComponent', () => {
  let component: OneMonthRenewComponent;
  let fixture: ComponentFixture<OneMonthRenewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OneMonthRenewComponent]
    });
    fixture = TestBed.createComponent(OneMonthRenewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
