import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NormalUpdateComponent } from './normal-update.component';

describe('NormalUpdateComponent', () => {
  let component: NormalUpdateComponent;
  let fixture: ComponentFixture<NormalUpdateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NormalUpdateComponent]
    });
    fixture = TestBed.createComponent(NormalUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
