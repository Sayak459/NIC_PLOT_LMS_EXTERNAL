import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandoverComponent } from './handover.component';

describe('HandoverComponent', () => {
  let component: HandoverComponent;
  let fixture: ComponentFixture<HandoverComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HandoverComponent]
    });
    fixture = TestBed.createComponent(HandoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
