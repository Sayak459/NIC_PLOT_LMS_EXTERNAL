import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FullHandoverComponent } from './full-handover.component';

describe('FullHandoverComponent', () => {
  let component: FullHandoverComponent;
  let fixture: ComponentFixture<FullHandoverComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FullHandoverComponent]
    });
    fixture = TestBed.createComponent(FullHandoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
