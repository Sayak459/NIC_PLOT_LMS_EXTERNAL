import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenewUpdateComponent } from './renew-update.component';

describe('RenewUpdateComponent', () => {
  let component: RenewUpdateComponent;
  let fixture: ComponentFixture<RenewUpdateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RenewUpdateComponent]
    });
    fixture = TestBed.createComponent(RenewUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
