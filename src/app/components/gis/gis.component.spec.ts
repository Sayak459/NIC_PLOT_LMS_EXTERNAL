import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GisComponent } from './gis.component';

describe('GisComponent', () => {
  let component: GisComponent;
  let fixture: ComponentFixture<GisComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GisComponent]
    });
    fixture = TestBed.createComponent(GisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
