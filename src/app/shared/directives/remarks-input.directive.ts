import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[remarksInput]'
})
export class RemarksInputDirective {

  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInput(event: any) {
    let value: string = event.target.value;

    // Remove tags
    value = value.replace(/[<>[\]{}]/g, '');

    // Allow only limited chars
    value = value.replace(/[^A-Za-z0-9 .,()\-]/g, '');

    // Max 200 chars
    value = value.substring(0, 200);

    this.el.nativeElement.value = value;
  }

  @HostListener('paste', ['$event']) blockPaste(e: ClipboardEvent) { e.preventDefault(); }
  @HostListener('copy', ['$event']) blockCopy(e: ClipboardEvent) { e.preventDefault(); }
  @HostListener('cut', ['$event']) blockCut(e: ClipboardEvent) { e.preventDefault(); }
}
