// import { Directive, HostListener, ElementRef } from '@angular/core';

// @Directive({
//   selector: '[fileSize]'
// })
// export class FileSizeDirective {

//   @HostListener('change', ['$event'])
//   onChange(event: any) {
//     const file = event.target.files[0];

//     if (file && file.size > 2 * 1024 * 1024) {
//       event.target.value = '';
//       alert('File exceeds 2MB limit');
//     }
//   }
// }

import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[fileSize]',
})
export class FileSizeDirective {
  private maxSize = 2 * 1024 * 1024; // 2MB

  // ✅ REGEX: only .pdf extension
  private fileTypeRegex = /\.pdf$/i;

  // ✅ Allowed MIME type for PDF
  private allowedMimeType = 'application/pdf';

  @HostListener('change', ['$event'])
  onChange(event: any) {
    const file: File = event.target.files[0];

    if (!file) return;

    // 1️⃣ FILE SIZE (NUMBER CHECK)
    if (file.size > this.maxSize) {
      this.reset(event, 'File exceeds 2MB limit');
      return;
    }

    // 2️⃣ FILE EXTENSION (REGEX CHECK)
    if (!this.fileTypeRegex.test(file.name)) {
      this.reset(event, 'Only PDF files are allowed');
      return;
    }

    // 3️⃣ MIME TYPE CHECK (SECURITY)
    if (file.type !== this.allowedMimeType) {
      this.reset(event, 'Invalid PDF file');
      return;
    }
  }

  private reset(event: any, message: string) {
    event.target.value = '';
    alert(message);
  }
}
