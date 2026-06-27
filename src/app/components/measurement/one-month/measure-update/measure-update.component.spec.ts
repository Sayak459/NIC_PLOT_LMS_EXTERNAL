import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeasureUpdateComponent } from './measure-update.component';

describe('MeasureUpdateComponent', () => {
  let component: MeasureUpdateComponent;
  let fixture: ComponentFixture<MeasureUpdateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MeasureUpdateComponent]
    });
    fixture = TestBed.createComponent(MeasureUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
