import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OneMonthFormComponent } from './one-month-form.component';

describe('OneMonthFormComponent', () => {
  let component: OneMonthFormComponent;
  let fixture: ComponentFixture<OneMonthFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OneMonthFormComponent]
    });
    fixture = TestBed.createComponent(OneMonthFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
