import { Directive, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: '[noPastDate]'
})
export class NoPastDateDirective implements OnInit {

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    const today = new Date();

    // MIN DATE → yesterday
    const minDate = new Date(today);
    minDate.setDate(today.getDate() - 1);

    // MAX DATE → 10 years after today
    const maxDate = new Date(today);
    maxDate.setFullYear(today.getFullYear() + 10);

    const minStr = minDate.toISOString().split('T')[0];
    const maxStr = maxDate.toISOString().split('T')[0];

    this.el.nativeElement.setAttribute('min', minStr);
    this.el.nativeElement.setAttribute('max', maxStr);
  }
}
