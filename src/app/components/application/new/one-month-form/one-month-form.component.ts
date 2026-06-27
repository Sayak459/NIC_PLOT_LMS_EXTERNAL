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
  lndcNo: string;
  cargoId: string;
  cargoCd: string;
  cargoDesc: string;
}

@Component({
  selector: 'app-one-month-form',
  templateUrl: './one-month-form.component.html',
  styleUrls: ['./one-month-form.component.scss'],
})
export class OneMonthFormComponent implements OnInit {
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
    lineNo: string;
    cargoCode: string;
    cargoDesc: string;
    cargoId: string;
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
      vcn: ['', Validators.required],
      purpose_cd: ['', Validators.required],
      vessel_name: [{ value: '', disabled: true }],
      rotation_no: [{ value: '', disabled: true }],
      rotation_date: [{ value: '', disabled: true }],
      trans_mode: ['', Validators.required],
      agent: ['', Validators.required],
      from_dt: ['', Validators.required],
      upto_dt: ['', Validators.required],
      line_no: [''],
      cargo_type: ['', Validators.required],
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
      // clear previously selected yard
      this.form.get('shed_yard')?.setValue('');

      if (!loc) {
        return;
      }

      if (this.shedYardsByGroup[loc] && this.shedYardsByGroup[loc].length) {
        return;
      }

      this.fetchShedYardsFor(loc);
    });

    // Line selection change — nothing special here
    this.form.get('line_no')?.valueChanges.subscribe(() => {
      // intentional no-op
    });
  }

  get cargoList(): FormArray {
    return this.form.get('cargoList') as FormArray;
  }

  // ========= API: Fetch Voyage ==========
  fetchVoyage() {
    const vcn: string = this.form.get('vcn')?.value || '';
    const purpose_cd = this.form.get('purpose_cd')?.value;

    const isVcnInvalid = !vcn || vcn === 'CCU1' || !/^CCU1\d+$/.test(vcn);

    // ================= FRONTEND VALIDATION =================
    if (isVcnInvalid || !purpose_cd) {
      this.missingFields = [];

      if (isVcnInvalid) this.missingFields.push('VCN Number');
      if (!purpose_cd) this.missingFields.push('Purpose');

      this.modalData = {
        status: 'Missing',
        msg: 'Please fill required fields before fetching voyage.', // frontend only
        app_no: '-',
      };

      document.getElementById('openMissingModalBtn')?.click();
      return;
    }

    // ================= DISABLE GET BUTTON =================
    this.loadingVoyage = true;

    const url = environment.baseUrl + environment.getVoyageAndCargoDetails;

    this.http
      .post<any>(url, {
        vcn: vcn,
        purposeCd: purpose_cd,
      })
      .subscribe({
        // ================= SUCCESS =================
        next: (res) => {
          if (res?.status === 'Success' && res?.data?.voyage) {
            this.form.patchValue({
              vessel_name: res.data.voyage?.vesName || '',
              rotation_no: res.data.voyage?.impRtNo || '',
              rotation_date: res.data.voyage?.impRtDt?.slice(0, 10) || '',
            });

            this.lineOptions = res.data.lines || [];

            this.form.get('vcn')?.disable();
            this.form.get('purpose_cd')?.disable();

            // keep GET disabled after success
            this.loadingVoyage = true;
          } else {
            // ================= API RESPONDED BUT FAILED =================
            this.loadingVoyage = false;

            this.modalData = {
              status: res?.status || 'Failed',
              msg: res?.msg || 'No voyage data found for the given VCN.',
              app_no: res?.data?.app_no || '-',
            };

            document.getElementById('openFailedModalBtn')?.click();
          }
        },

        // ================= HTTP ERROR =================
        error: (err) => {
          console.error('Voyage API Error:', err);

          this.loadingVoyage = false;

          const server = err?.error;

          this.modalData = {
            status: server?.status || 'Error',
            msg:
              server?.msg ||
              err?.message ||
              'Unable to fetch voyage details. Please try again later.',
            app_no: server?.data?.app_no || '-',
          };

          document.getElementById('openFailedModalBtn')?.click();
        },
      });
  }

  // ========= Add Cargo Row ===========
  addCargoRow() {
    const ln = this.form.get('line_no')?.value;
    if (!ln) {
      this.missingFields = ['Line Number'];

      this.modalData = {
        status: 'Missing',
        msg: 'Please select at least one line before adding cargo.',
        app_no: '-',
      };

      document.getElementById('openMissingModalBtn')?.click();
      return;
    }

    const selectedIndex = this.lineOptions.findIndex((x) => x.lndcNo === ln);
    if (selectedIndex === -1) return;

    const selected = this.lineOptions[selectedIndex];
    const sl = this.addedCargoRows.length + 1;

    this.addedCargoRows.push({
      sl,
      lineNo: selected.lndcNo,
      cargoCode: selected.cargoCd,
      cargoDesc: selected.cargoDesc,
      cargoId: selected.cargoId,
    });

    this.cargoList.push(
      this.fb.group({
        sl_no: [sl],
        line_no: [selected.lndcNo],
        cargo_cd: [selected.cargoCd],
        cargo_desc: [selected.cargoDesc],
        cargo_id: [selected.cargoId],
      })
    );

    this.lineOptions.splice(selectedIndex, 1);
    this.form.get('line_no')?.setValue('');
  }

  // ========= Remove Cargo Row ===========
  removeCargoRow(i: number) {
    const removed = this.addedCargoRows.splice(i, 1)[0];
    this.cargoList.removeAt(i);

    this.lineOptions.push({
      lndcNo: removed.lineNo,
      cargoId: removed.cargoId,
      cargoCd: removed.cargoCode,
      cargoDesc: removed.cargoDesc,
    });

    this.lineOptions.sort((a, b) => a.lndcNo.localeCompare(b.lndcNo));
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

    // No file selected
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
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      this.fileError = 'File size must be less than 2 MB.';
      this.uploadedFile = undefined;
      this.form.patchValue({ licence_file: '' });
      return;
    }

    // === VALID FILE ===
    this.fileError = '';
    this.uploadedFile = file;
    this.form.patchValue({ licence_file: file.name });
  }

  // ========== SAVE with modals (success / fail / missing) ==========
  saveForm() {
    // Build list of invalid/required fields to show in 'missing' modal
    this.missingFields = [];

    // mark all to show validation errors on form
    this.form.markAllAsTouched();

    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key);
      // only consider controls that are enabled (disabled controls are ignored)
      if (control && control.enabled && control.invalid) {
        // human-friendly label: convert underscores to spaces and uppercase
        this.missingFields.push(this.humanizeField(key));
      }
    });

    if (this.missingFields.length > 0) {
      // show missing fields modal
      this.modalData = {
        status: 'Missing',
        msg: 'Please fill required fields highlighted in the form.',
        app_no: '-',
      };
      // trigger missing modal
      document.getElementById('openMissingModalBtn')?.click();
      return;
    }

    this.saving = true;

    const selectedShed = this.shedYardList.find(
      (s) => s.shedYardName.trim() === this.form.value.shed_yard
    );

    const shedCd = selectedShed ? selectedShed.shedCd : null;

    // ---------- Build JSON payload ----------

    const raw = this.form.getRawValue();

    const payloadJson = {
      wla: {
        vcn: raw.vcn,
        purpose_cd: raw.purpose_cd,
        agent: raw.agent,
        party_remarks: raw.party_remarks,
        trans_mode: raw.trans_mode,
        shed_cd: raw.shed_yard,
        from_dt: raw.from_dt,
        upto_dt: raw.upto_dt,
        total_app_area: raw.apply_area,
        cargo_type: raw.cargo_type,
      },

      cargoList: this.cargoList.value.map((c: any) => ({
        line_no: c.line_no,
        cargo_cd: c.cargo_cd,
        cargo_desc: c.cargo_desc,
      })),

      wlu: {
        pdf_desc: this.form.value.pdf_desc,
        action_flag: 'N',
      },
    };

    // ---------- MULTIPART FormData ----------
    const fd = new FormData();
    fd.append('body', JSON.stringify(payloadJson));

    if (this.uploadedFile) {
      fd.append('file', this.uploadedFile, this.uploadedFile.name);
    }

    const url = environment.baseUrl + environment.setOneLandLicence;

    //DO NOT set headers (Angular will handle multipart)
    this.http.post(url, fd).subscribe({
      next: (res: any) => {
        this.saving = false;

        // success modal payload
        this.modalData.status = res?.status || 'Success';
        this.modalData.msg = res?.msg || 'Saved successfully';
        this.modalData.app_no = res?.data?.app_no || '-';

        // trigger success modal
        document.getElementById('openSuccessModalBtn')?.click();
        // Clear form after modal close
      },
      error: (err) => {
        console.error('Save Error:', err);
        this.saving = false;

        // failed modal payload (try to read server payload if present)
        const server = err?.error;
        this.modalData.status = server?.status || 'Failed';
        this.modalData.msg =
          server?.msg || err?.message || 'Something went wrong';
        this.modalData.app_no = server?.data?.app_no || '-';

        // trigger failed modal
        document.getElementById('openFailedModalBtn')?.click();
        //this.router.navigate(['/dashboard']);
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

  // small helper to make field name human friendly
  private humanizeField(k: string): string {
    if (k === 'cargoList') {
      return 'Cargo Table (add at least one row)';
    }
    return k
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  clearFormAfterSave() {
    this.form.reset({
      vcn: 'CCU1',
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
      party_remarks: '',
    });

    this.loadingVoyage = false;

    // Clear file control states
    this.form.get('licence_file')?.setErrors(null);
    this.form.get('licence_file')?.markAsUntouched();
    this.form.get('licence_file')?.markAsPristine();

    // 🔥 CRITICAL FIX
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }

    this.uploadedFile = undefined;

    // Reset cargo
    this.addedCargoRows = [];
    while (this.cargoList.length) this.cargoList.removeAt(0);

    this.shedYardsByGroup = {};
    this.shedYardList = [];

    this.form.get('vcn')?.enable();
    this.form.get('purpose_cd')?.enable();
  }

  clearForm() {
    this.form.reset({
      vcn: 'CCU1',
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

    this.loadingVoyage = false;

    this.addedCargoRows = [];
    while (this.cargoList.length) this.cargoList.removeAt(0);

    this.uploadedFile = undefined;
    this.shedYardsByGroup = {};
    this.shedYardList = [];

    // ✅ Re-enable VCN and Purpose CD so user can edit again
    this.form.get('vcn')?.enable();
    this.form.get('purpose_cd')?.enable();
  }
}
