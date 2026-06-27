import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[noTypeDate]'
})
export class NoTypeDateDirective {

  @HostListener('keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    e.preventDefault(); // disable typing
  }
}
