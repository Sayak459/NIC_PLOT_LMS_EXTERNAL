import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElevenMonthFormComponent } from './eleven-month-form.component';

describe('ElevenMonthFormComponent', () => {
  let component: ElevenMonthFormComponent;
  let fixture: ComponentFixture<ElevenMonthFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ElevenMonthFormComponent]
    });
    fixture = TestBed.createComponent(ElevenMonthFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
