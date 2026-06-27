import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ReportService } from 'src/app/services/report.service';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
})
export class ReportComponent {
  reportForm: FormGroup;
  loading = false;
  errorMessage = '';

  appCd!: string;

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private route: ActivatedRoute,
  ) {
    this.reportForm = this.fb.group({
      app_no: ['', Validators.required],
    });

    /** ✅ CRITICAL FIX – READ FROM URL */
    this.appCd = this.route.snapshot.paramMap.get('appCd')!;
    console.log('Loaded Report Code:', this.appCd);
  }

  generateReport(): void {
    if (this.reportForm.invalid) {
      this.errorMessage = 'Please fill required fields';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { app_no, entry_by } = this.reportForm.value;

    const payload = {
      params: {
        app_no: app_no,
        entry_by: 'TPRC1001', // This can be dynamic based on user session
      },
    };

    /** ✅ USE ROUTE VALUE */
    this.reportService.generateReport(this.appCd, payload).subscribe({
      next: (response) => {
        let fileName = 'report.pdf';

        const contentDisposition = response.headers.get('content-disposition');

        if (contentDisposition) {
          const matches = /filename="([^"]*)"/.exec(contentDisposition);
          if (matches?.[1]) {
            fileName = matches[1];
          }
        }

        const blob = new Blob([response.body!], {
          type: 'application/pdf',
        });

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();

        window.URL.revokeObjectURL(url);

        this.loading = false;
      },
      error: (error) => {
        console.error('Report Error:', error);
        this.errorMessage = 'Failed to generate report';
        this.loading = false;
      },
    });
  }
}
