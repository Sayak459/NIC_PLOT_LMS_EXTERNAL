import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartialHandoverComponent } from './partial-handover.component';

describe('PartialHandoverComponent', () => {
  let component: PartialHandoverComponent;
  let fixture: ComponentFixture<PartialHandoverComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PartialHandoverComponent]
    });
    fixture = TestBed.createComponent(PartialHandoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
