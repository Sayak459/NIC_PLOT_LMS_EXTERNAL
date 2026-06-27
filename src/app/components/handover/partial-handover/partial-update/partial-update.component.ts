import { HandoverService } from 'src/app/services/handover.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-partial-update',
  templateUrl: './partial-update.component.html',
  styleUrls: ['./partial-update.component.scss'],
})
export class PartialUpdateComponent implements OnInit {
  appNo: string = '';
  details: any = null;
  loading = true;

  form = {
    requestedPartialHandoverDate: '',
    remarks: '',
    docDescription: '',
    partialArea: null as number | null,
    file: null as File | null,
  };

  fileError: string = '';
  partialAreaError: string = '';
  isPartialAreaDisabled = false;

  // Modal data holder (used by all 3 modals)
  modalData: any = {
    status: '',
    msg: '',
    app_no: '',
  };

  // Missing fields list (for 'miss' modal)
  missingFields: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private partialservice: HandoverService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.appNo = this.route.snapshot.paramMap.get('appNo') || '';
    this.loadDetails();
  }

  /** -------------------------------
   *  LOAD RECORD DETAILS
   *  ------------------------------- */
  loadDetails() {
    this.loading = true;

    this.partialservice.getPartialHandoverList().subscribe({
      next: (res: any) => {
        // 🔥 Support all list keys
        const list = res.data?.pendingHandover || [];

        // 🔥 Fix string/number mismatch
        this.details = list.find(
          (d: any) => String(d.appNo) === String(this.appNo)
        );

        if (!this.details) {
        }

        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  /** -------------------------------
   *  FILE CHANGE EVENT
   *  ------------------------------- */
  onFileChange(event: any) {
    this.fileError = '';
    const file = event.target.files[0];
    if (!file) return;

    const maxSizeMB = 2;
    if (file.type !== 'application/pdf') {
      this.fileError = 'Only PDF files are allowed.';
      this.form.file = null;
      return;
    }
    if (file.size / 1024 / 1024 > maxSizeMB) {
      this.fileError = `File size exceeds ${maxSizeMB} MB.`;
      this.form.file = null;
      return;
    }

    this.form.file = file;
  }

  /** -------------------------------
   *  SAVE UPDATE
   *  ------------------------------- */
  saveUpdate() {
    this.missingFields = [];

    // Validate manually like your previous form
    if (!this.form.requestedPartialHandoverDate)
      this.missingFields.push('Requested Date');

    if (!this.form.remarks) this.missingFields.push('Remarks');

    if (!this.form.file) this.missingFields.push('Attach a file');

    if (!this.form.docDescription)
      this.missingFields.push('Document Description');

    if (!this.form.partialArea) this.missingFields.push('Partial Area');

    // If missing fields → open missing modal
    if (this.missingFields.length > 0) {
      this.modalData = {
        status: 'Missing',
        msg: 'Please fill required fields highlighted in the form.',
        app_no: '-',
      };
      document.getElementById('openMissingModalBtn')?.click();
      return;
    }

    // ------------------------------
    // Build payload object
    // ------------------------------
    const payloadJson = {
      wla: {
        app_no: this.appNo,
        san: this.details?.spaceAllocNo || '',
        req_dt: this.form.requestedPartialHandoverDate,
        ag_remarks: this.form.remarks,
        area: this.form.partialArea, // ✅ USE PARTIAL AREA
      },
      wlu: {
        pdf_desc: this.form.docDescription || '',
        action_flag: 'N',
      },
    };

    // ------------------------------
    // Build FormData
    // ------------------------------
    const formData = new FormData();
    formData.append('body', JSON.stringify(payloadJson));

    if (this.form.file) {
      formData.append('file', this.form.file);
    }

    // ------------------------------
    // Hit API
    // ------------------------------
    this.partialservice.savePartialHandover(formData).subscribe({
      next: (res: any) => {
        // success modal
        this.modalData.status = res?.status || 'Success';
        this.modalData.msg = res?.msg || 'Update saved successfully';
        this.modalData.app_no = res.data?.app_no;
        document.getElementById('openSuccessModalBtn')?.click();
      },
      error: (err) => {
        const server = err?.error;

        this.modalData.status = server?.status || 'Failed';
        this.modalData.msg =
          server?.msg || err?.message || 'Failed to save update';
        // this.modalData.app_no = this.appNo;

        document.getElementById('openFailedModalBtn')?.click();
      },
    });

    // this.modalData = {
    //     status: 'Success',
    //     msg: 'Partial Handover successful',
    //     app_no: 'APX25XXXXXX',
    //   };

    //   // trigger success modal
    //   document.getElementById('openSuccessModalBtn')?.click();

    //   return;
  }

  redirectBack() {
    // Prefer relative navigation if inside dashboard
    if (this.router.url.includes('/dashboard')) {
      // Go one level up relative to current route
      this.router.navigate(['/dashboard/handover/partial-handover'], {
        relativeTo: this.route,
      });
    } else {
      // Standalone route → fallback to absolute route
      this.router.navigate(['/handover/partial-handover']);
    }
  }

  /** -------------------------------
   *  CLEAR FORM
   *  ------------------------------- */
  clearForm() {
    this.form = {
      requestedPartialHandoverDate: '',
      remarks: '',
      docDescription: '',
      partialArea: null,
      file: null,
    };

    this.fileError = '';
    this.partialAreaError = '';
    this.isPartialAreaDisabled = false;
  }

  /** -------------------------------
   *  NAVIGATION
   *  ------------------------------- */
  // goBack() {
  //   this.router.navigate(['/dashboard/handover/partial-handover']);
  // }
  goBack() {
    const isInsideDashboard = this.router.url.includes('/dashboard');

    const target = isInsideDashboard
      ? ['/dashboard/handover/partial-handover']
      : ['/handover/partial-handover'];

    this.router.navigate(target);
  }

  onPartialAreaInput(): void {
    this.partialAreaError = '';

    const actualArea = Number(this.details?.actAllotArea || 0);
    const value = Number(this.form.partialArea);

    // Empty or NaN
    if (!value || isNaN(value)) {
      this.partialAreaError = 'Partial area is required';
      return;
    }

    // Cannot be zero or negative
    if (value <= 0) {
      this.partialAreaError = 'Partial area must be greater than 0';
      this.form.partialArea = null;
      return;
    }

    // Cannot be equal or more than actual area
    if (value >= actualArea) {
      this.partialAreaError = `Partial area must be less than ${actualArea}`;
      this.form.partialArea = null;
      return;
    }

    // Auto-disable if only one valid option left
    if (actualArea - value === 0) {
      this.isPartialAreaDisabled = true;
    } else {
      this.isPartialAreaDisabled = false;
    }
  }
}
