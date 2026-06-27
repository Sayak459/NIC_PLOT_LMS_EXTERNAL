import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

interface ShedYard {
  shedCd: string;
  shedYardName: string;
  [k: string]: any;
}

interface CargoLine {
  cargoCd: string;
  cargoDesc: string;
}

@Component({
  selector: 'app-eleven-month-form',
  templateUrl: './eleven-month-form.component.html',
  styleUrls: ['./eleven-month-form.component.scss'],
})
export class ElevenMonthFormComponent implements OnInit {
  form!: FormGroup;
  loadingVoyage = false;
  saving = false;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  savedApplicationNo: string | null = null; // will hold the app no after save

  // Static mappings

  //purpose
  purposes = { I: 'Import', E: 'Export', S: 'Stock' } as const;

  //agents
  agents = {
    S: 'Steamer Agent',
    C: 'Clearing Agent',
    I: 'Importer',
    H: 'Handling Agent',
    E: 'Exporter',
    T: 'Stevedore',
  } as const;

  //transport
  transportModes = { S: 'Vessel', V: 'Road', R: 'Rail', B: 'Barge' } as const;

  //cargo types
  cargoTypes = { G: 'General', N: 'Nepal', B: 'Bhutan' } as const;

  purposeKeys = Object.keys(this.purposes) as Array<keyof typeof this.purposes>;
  agentKeys = Object.keys(this.agents) as Array<keyof typeof this.agents>;
  transModeKeys = Object.keys(this.transportModes) as Array<
    keyof typeof this.transportModes
  >;
  cargoTypeKeys = Object.keys(this.cargoTypes) as Array<
    keyof typeof this.cargoTypes
  >;

  // From API
  lineOptions: CargoLine[] = [];
  shedYardList: ShedYard[] = []; // last-fetched list (not strictly required)
  shedYardsByGroup: Record<string, ShedYard[]> = {}; // KPD / NSD cache

  //Remarks
  addedCargoRows: Array<{
    sl: number;
    cargoCode: string;
    cargoDesc: string;
  }> = [];

  uploadedFile?: File;
  response: any;

  // Modal data holder (used by all 3 modals)
  modalData: any = {
    status: '',
    msg: '',
    app_no: '',
  };

  // Missing fields list (for 'miss' modal)
  missingFields: string[] = [];

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      from_dt: ['', Validators.required],
      upto_dt: ['', Validators.required],
      cargo_type: [''],
      shed_location: ['', Validators.required],
      shed_yard: ['', Validators.required],
      apply_area: ['', [Validators.required, Validators.max(10000)]],

      licence_file: ['', Validators.required],
      pdf_desc: ['', Validators.required],
      cargoList: this.fb.array([], Validators.required),
      party_remarks: ['', Validators.required],
    });

    // Auto calculate upto date
    this.form.get('from_dt')?.valueChanges.subscribe((val) => {
      if (!val) {
        this.form.get('upto_dt')?.setValue('');
        return;
      }
      const d = new Date(val);
      d.setDate(d.getDate() + 29);
      this.form.get('upto_dt')?.setValue(d.toISOString().slice(0, 10));
    });

    // When user picks shed_location, fetch yards for that location
    this.form.get('shed_location')?.valueChanges.subscribe((loc) => {
      this.form.get('shed_yard')?.setValue('');
      if (!loc) return;

      if (this.shedYardsByGroup[loc] && this.shedYardsByGroup[loc].length)
        return;

      this.fetchShedYardsFor(loc);
    });

    // Fetch cargo list initially
    this.fetchCargoList();
  }

  get cargoList(): FormArray {
    return this.form.get('cargoList') as FormArray;
  }

  // ========= Fetch Cargo List ==========
  fetchCargoList() {
    const url = environment.baseUrl + environment.getCargoMidTerm;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        if (res?.status === 'Success') {
          // map only cargoCd and cargoDesc
          this.lineOptions = (res.data.cargoList || []).map((c: any) => ({
            cargoCd: c.cargoCd,
            cargoDesc: c.cargoDesc,
          }));
        }
      },
      error: (err) => console.error('Cargo API Error:', err),
    });
  }

  // ========= Add Cargo Row ===========
  addCargoRow() {
    const cargoCd = this.form.get('cargo_type')?.value;

    // ❌ VALIDATION: No cargo selected
    if (!cargoCd) {
      this.missingFields = ['Cargo Type'];

      this.modalData = {
        status: 'Missing',
        msg: 'Please select at least one cargo before adding cargo.',
        app_no: '-',
      };

      document.getElementById('openMissingModalBtn')?.click();
      return;
    }

    const selected = this.lineOptions.find(
      (x) => x.cargoCd === this.form.get('cargo_type')?.value
    );
    if (!selected) return;

    const sl = this.addedCargoRows.length + 1;

    this.addedCargoRows.push({
      sl,
      cargoCode: selected.cargoCd,
      cargoDesc: selected.cargoDesc,
    });

    this.cargoList.push(
      this.fb.group({
        sl_no: [sl],
        cargo_cd: [selected.cargoCd],
        cargo_desc: [selected.cargoDesc],
      })
    );

    // Remove from dropdown to prevent duplicate selection
    this.lineOptions = this.lineOptions.filter(
      (x) => x.cargoCd !== selected.cargoCd
    );
    this.form.get('cargo_type')?.setValue('');
  }

  // ========= Remove Cargo Row ===========
  removeCargoRow(i: number) {
    const removed = this.addedCargoRows.splice(i, 1)[0];
    this.cargoList.removeAt(i);

    // Add back to line options
    this.lineOptions.push({
      cargoCd: removed.cargoCode,
      cargoDesc: removed.cargoDesc,
    });

    this.lineOptions.sort((a, b) => a.cargoCd.localeCompare(b.cargoCd));
    this.addedCargoRows.forEach((r, idx) => (r.sl = idx + 1));
  }

  // ========= Shed / Yard ===========
  fetchShedYardsFor(loc: string) {
    if (!loc) return;

    const url = environment.baseUrl + environment.getShedYard;
    this.http.post<any>(url, { lmsLoc: loc }).subscribe({
      next: (res) => {
        const list = res?.data?.shedYardList || [];
        this.shedYardsByGroup[loc] = list;
        this.shedYardList = list;
      },
      error: (err) => {
        console.error('getShedYard error for', loc, err);
        this.shedYardsByGroup[loc] = [];
      },
    });
  }

  //File adding
  fileError: string = '';

  onFileChange(evt: Event) {
    const input = evt.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      this.uploadedFile = undefined;
      this.fileError = '';
      this.form.patchValue({ licence_file: '' });
      return;
    }

    const file = input.files[0];

    // === 1. Validate type (PDF only) ===
    if (file.type !== 'application/pdf') {
      this.fileError = 'Only PDF files are allowed.';
      this.uploadedFile = undefined;
      this.form.patchValue({ licence_file: '' });
      return;
    }

    // === 2. Validate size (Max 2 MB) ===
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      this.fileError = 'File size must be less than 2 MB.';
      this.uploadedFile = undefined;
      this.form.patchValue({ licence_file: '' });
      return;
    }

    this.fileError = '';
    this.uploadedFile = file;
    this.form.patchValue({ licence_file: file.name });
  }

  // ========= SAVE with modals ==========

  saveForm() {
    this.missingFields = [];
    this.form.markAllAsTouched();

    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key);
      if (control && control.enabled && control.invalid) {
        this.missingFields.push(this.humanizeField(key));
      }
    });

    if (this.missingFields.length > 0) {
      this.modalData = {
        status: 'Missing',
        msg: 'Please fill required fields highlighted in the form.',
        app_no: '-',
      };
      document.getElementById('openMissingModalBtn')?.click();
      return;
    }

    this.saving = true;

    // ---------- Build JSON payload ----------
    const payloadJson = {
      wla: {
        party_remarks: this.form.value.party_remarks || '',
        shed_cd: this.form.value.shed_yard,
        from_dt: this.form.value.from_dt,
        upto_dt: this.form.value.upto_dt,
        total_app_area: this.form.value.apply_area,
      },

      cargoList: this.cargoList.value.map((c: any) => ({
        cargo_cd: c.cargo_cd,
        cargo_desc: c.cargo_desc, // added as per API payload example
      })),

      wlu: {
        pdf_desc: this.form.value.pdf_desc,
        action_flag: 'N',
      },
    };

    const fd = new FormData();
    fd.append('body', JSON.stringify(payloadJson));

    if (this.uploadedFile) {
      fd.append('file', this.uploadedFile, this.uploadedFile.name);
    }

    const url = environment.baseUrl + environment.setElevenLandLicence;

    this.http.post(url, fd).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.modalData.status = res?.status || 'Success';
        this.modalData.msg = res?.msg || 'Saved successfully';
        this.modalData.app_no = res?.data?.app_no || '-';
        document.getElementById('openSuccessModalBtn')?.click();
      },
      error: (err) => {
        console.error('Save Error:', err);
        this.saving = false;
        const server = err?.error;
        this.modalData.status = server?.status || 'Failed';
        this.modalData.msg =
          server?.msg || err?.message || 'Something went wrong';
        this.modalData.app_no = server?.data?.app_no || '-';
        document.getElementById('openFailedModalBtn')?.click();
      },
    });

    // this.saving = false;
    // this.modalData = {
    //   status: 'Success',
    //   msg: 'Saved successfully',
    //   app_no: 'APX25XXXXXX',
    // };

    // // trigger success modal
    // document.getElementById('openSuccessModalBtn')?.click();

    // return;
  }

  private humanizeField(k: string): string {
    if (k === 'cargoList') return 'Cargo Table (add at least one row)';
    return k
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  clearFormAfterSave() {
    this.form.reset({
      from_dt: '',
      upto_dt: '',
      line_no: '',
      cargo_type: '',
      shed_location: '',
      shed_yard: '',
      apply_area: '',
      licence_file: '',
      pdf_desc: '',
      party_remarks: '',
    });

    // Clear file control states
    this.form.get('licence_file')?.setErrors(null);
    this.form.get('licence_file')?.markAsUntouched();
    this.form.get('licence_file')?.markAsPristine();

    // 🔥 CRITICAL FIX
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    this.uploadedFile = undefined;

    // Reset cargo rows
    this.addedCargoRows = [];
    while (this.cargoList.length) this.cargoList.removeAt(0);

    this.shedYardsByGroup = {};
    this.shedYardList = [];

    // // Re-enable editable fields if disabled
    // this.form.get('vcn')?.enable();
    // this.form.get('purpose_cd')?.enable();
  }

  clearForm() {
    this.form.reset({
      vcn: '',
      purpose_cd: '',
      vessel_name: '',
      rotation_no: '',
      rotation_date: '',
      trans_mode: '',
      agent: '',
      from_dt: '',
      upto_dt: '',
      line_no: '',
      cargo_type: '',
      shed_location: '',
      shed_yard: '',
      apply_area: '',
      licence_file: '',
      pdf_desc: '',
    });

    this.addedCargoRows = [];
    while (this.cargoList.length) this.cargoList.removeAt(0);

    this.uploadedFile = undefined;
    this.shedYardsByGroup = {};
    this.shedYardList = [];
  }
}
