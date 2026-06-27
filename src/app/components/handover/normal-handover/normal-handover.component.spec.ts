import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NormalHandoverComponent } from './normal-handover.component';

describe('NormalHandoverComponent', () => {
  let component: NormalHandoverComponent;
  let fixture: ComponentFixture<NormalHandoverComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NormalHandoverComponent]
    });
    fixture = TestBed.createComponent(NormalHandoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
