import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-handover',
  templateUrl: './handover.component.html',
  styleUrls: ['./handover.component.scss'],
})
export class HandoverComponent {
  constructor(private router: Router) {}
  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
