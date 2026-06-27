import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[areaInput]',
})
export class AreaInputDirective {
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInput(event: any) {
    let value = event.target.value;

    // Allow only digits while typing
    value = value.replace(/[^0-9]/g, '');

    this.el.nativeElement.value = value;
  }

  @HostListener('blur')
  onBlur() {
    let value = this.el.nativeElement.value;

    if (!value) return;

    let num = Number(value);

    // Force multiple of 100 ONLY after input is done

    this.el.nativeElement.value = num.toString();
  }

  @HostListener('paste', ['$event']) blockPaste(e: ClipboardEvent) {
    e.preventDefault();
  }
  @HostListener('copy', ['$event']) blockCopy(e: ClipboardEvent) {
    e.preventDefault();
  }
  @HostListener('cut', ['$event']) blockCut(e: ClipboardEvent) {
    e.preventDefault();
  }
}
