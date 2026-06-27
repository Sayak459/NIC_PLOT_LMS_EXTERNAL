import {
  Directive,
  ElementRef,
  HostListener,
  OnInit,
  Optional,
  Self,
} from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[vcnInput]',
})
export class VcnInputDirective implements OnInit {
  private readonly prefix = 'CCU1';
  private readonly maxLength = 11;

  constructor(
    private el: ElementRef<HTMLInputElement>,
    @Optional() @Self() private ngControl: NgControl
  ) {}

  ngOnInit() {
    // Set prefix ONLY ONCE
    if (!this.el.nativeElement.value) {
      this.setValue(this.prefix);
    }
    this.setCursorToEnd();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const value = this.el.nativeElement.value;
    const cursorPos = this.el.nativeElement.selectionStart ?? 0;

    // 🚫 Prevent deleting prefix
    if (
      event.key === 'Backspace' &&
      cursorPos <= this.prefix.length
    ) {
      event.preventDefault();
      this.setValue(this.prefix);
      this.setCursorToEnd();
    }
  }

  @HostListener('input')
  onInput() {
    let value = this.el.nativeElement.value;

    // 🧷 Ensure prefix exists ONCE
    if (!value.startsWith(this.prefix)) {
      value = this.prefix;
    }

    // 🔢 Allow ONLY NUMBERS after prefix
    let numericPart = value
      .slice(this.prefix.length)
      .replace(/[^0-9]/g, '');

    value = (this.prefix + numericPart).slice(0, this.maxLength);

    this.setValue(value);
    this.setCursorToEnd();
  }

  private setValue(value: string) {
    this.el.nativeElement.value = value;

    if (this.ngControl?.control) {
      this.ngControl.control.setValue(value, {
        emitEvent: false,
        emitModelToViewChange: false,
      });
    }
  }

  private setCursorToEnd() {
    const len = this.el.nativeElement.value.length;
    this.el.nativeElement.setSelectionRange(len, len);
  }
}
