import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FullUpdateComponent } from './full-update.component';

describe('FullUpdateComponent', () => {
  let component: FullUpdateComponent;
  let fixture: ComponentFixture<FullUpdateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FullUpdateComponent]
    });
    fixture = TestBed.createComponent(FullUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
