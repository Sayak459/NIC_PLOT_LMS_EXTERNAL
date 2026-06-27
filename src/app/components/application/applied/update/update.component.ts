import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApplicationService } from 'src/app/services/application.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-update',
  templateUrl: './update.component.html',
  styleUrls: ['./update.component.scss'],
})
export class UpdateComponent implements OnInit {
  /** MODAL SUPPORT */
  modalData: any = {
    status: '',
    msg: '',
    app_no: '',
  };

  form!: FormGroup;
  appNo = '';
  loading = true;
  saving = false;

  licenseType = '';

  //Mappings

  //Purposes
  purposes: any = { I: 'Import', E: 'Export', S: 'Stock' };

  //Transport Modes
  transModes: any = { S: 'Vessel', V: 'Road', R: 'Rail', B: 'Barge' };

  //Agennts
  agents: any = {
    NONE: 'Select Agent',
    S: 'Steamer Agent',
    C: 'Clearing Agent',
    I: 'Importer/Stevedore',
    H: 'Handling Agent',
    E: 'Exporter',
  };

  //Cargo Types
  cargoTypes: any = { G: 'General', N: 'Nepal', B: 'Bhutan' };

  shedYardList: any[] = [];
  shedYardsByGroup: any = {};
  lineOptions: any[] = [];
  addedCargoRows: any[] = [];

  selectedFile: File | null = null;
  fileError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private http: HttpClient,
    private appService: ApplicationService
  ) {}

  ngOnInit(): void {
    this.initForm();

    //Taking data from row
    const nav = history.state;

    //Disabled if APL
    if (this.licenseType === 'APL') {
      this.form.get('transMode')?.disable();
      this.form.get('agent')?.disable();
    }

    if (nav.appNo) {
      this.appNo = nav.appNo;

      if (this.appNo.startsWith('APP')) {
        this.licenseType = 'APP';
      } else if (this.appNo.startsWith('APL')) {
        this.licenseType = 'APL';
      }

      this.form.patchValue({
        appNo: this.appNo,
        vcn: nav.vcn || '',
        purposeCd: nav.purposeCd || '',
        transMode: nav.transMode || '',
        agent: nav.agent || '',
        fromDt: nav.fromDt || '',
        uptoDt: nav.uptoDt || '',
        cargoType: nav.cargoType || '',
        verifyRemark: nav.verifyRemark || '',
        totalAppArea:
          nav.totalAppArea?.replace(' sqm', '') || nav.apply_area || '',
        vesname: nav.vesname || '',
        rotation_no: nav.rotation_no || '',
        rotation_date: nav.rotation_date || '',
        shed_cd: nav.shed_cd || '',
      });

      /** AUTO LOAD SHED / YARD */
      if (nav.lmsLoc) {
        this.fetchShedYard(nav.lmsLoc, nav.shed_cd);

        this.form.patchValue({
          shed_location: nav.lmsLoc,
          shedYardName: nav.shed_cd,
          shed_cd: nav.shed_cd,
        });
      }

      /** LOAD EXISTING CARGO */
      if (nav.appNo) {
        this.fetchExistingCargo(this.appNo);
      }

      /** FETCH VOYAGE + LINES */
      const vcn = nav.vcn;
      const purposeCd = nav.purposeCd;
      if (vcn && purposeCd) {
        this.fetchVoyagePreFill(vcn, purposeCd);
      }

      /** INITIAL CARGO ROW POPULATION */
      const allLines = nav.lines || nav.cargoLines || [];
      const existingCargo = nav.cargoList || nav.addedCargoRows || [];

      this.addedCargoRows = existingCargo.map((l: any, i: number) => ({
        sl: i + 1,
        lineNo: l.lineNo || l.lndcNo,
        cargoCode: l.cargoCode || l.cargoCd,
        cargoDesc: l.cargoDesc,
      }));

      this.lineOptions = allLines.filter(
        (ln: any) => !this.addedCargoRows.some((row) => row.lineNo == ln.lndcNo)
      );
    }

    this.loading = false;

    /** AUTO-UPDATE uptoDt */
    this.form.get('fromDt')?.valueChanges.subscribe((val) => {
      if (!val) {
        this.form.get('uptoDt')?.setValue('');
        return;
      }

      const d = new Date(val);
      d.setDate(d.getDate() + 29);

      const formatted = d.toISOString().slice(0, 10);

      if (this.form.get('uptoDt')?.value !== formatted) {
        this.form.get('uptoDt')?.setValue(formatted);
      }
    });
  }

  //Checking KPD or NSD
  onLocationChange(event: any) {
    const loc = event.target.value;
    this.form.patchValue({ shedYardName: '' });
    if (loc) this.fetchShedYard(loc);
  }

  //Loading list based on Location
  fetchExistingCargo(appNo: string) {
    const url = environment.baseUrl + environment.getCargoDetailsByApplication;

    this.http.post(url, { appNo }).subscribe({
      next: (res: any) => {
        const list = res?.data || [];

        this.addedCargoRows = list.map((l: any, idx: number) => ({
          sl: idx + 1,
          lineNo: l.lndcNo,
          cargoCode: l.cargoCd,
          cargoDesc: l.cargoDesc,
        }));
      },
    });
  }

  initForm() {
    this.form = this.fb.group({
      appNo: [''],
      vcn: [''],
      purposeCd: [''],
      vesname: [''],
      rotation_no: [''],
      rotation_date: [''],
      transMode: ['', Validators.required],
      agent: ['', Validators.required],
      fromDt: ['', Validators.required],
      uptoDt: ['', Validators.required],
      line_no: ['', Validators.required],
      cargoType: ['', Validators.required],
      shed_location: ['', Validators.required],
      shedYardName: ['', Validators.required],
      shed_cd: [''],
      totalAppArea: ['', [Validators.required, Validators.max(10000)]],
      party_remarks: ['', Validators.required],
      verifyRemark: ['', Validators.required],
      pdf_desc: ['', Validators.required],
    });
  }

  //Fetching the shed yard names list
  fetchShedYard(lmsLoc: string, selectedShedCd: string | null = null) {
    const url = environment.baseUrl + environment.getShedYard;

    this.http.post(url, { lmsLoc }).subscribe({
      next: (res: any) => {
        if (res?.data?.shedYardList) {
          this.shedYardList = res.data.shedYardList;
          this.shedYardsByGroup[lmsLoc] = this.shedYardList;

          if (selectedShedCd) {
            const exists = this.shedYardList.some(
              (yard: any) => yard.shedCd === selectedShedCd
            );

            if (exists) {
              this.form.patchValue({
                shedYardName: selectedShedCd,
              });
            }
          }
        }
      },
    });
  }

  //Getting crago details from api
  fetchVoyagePreFill(vcn: string, purposeCd: string) {
    const url = environment.baseUrl + environment.getVoyageAndCargoDetails;

    this.http.post(url, { vcn, purposeCd }).subscribe({
      next: (res: any) => {
        if (!res?.data) return;

        const voyage = res.data.voyage || {};
        const lines = res.data.lines || [];

        this.form.patchValue({
          vesname: voyage.vesName || '',
          rotation_no:
            purposeCd === 'I' ? voyage.impRtNo || '' : voyage.expRtNo || '',
          rotation_date:
            purposeCd === 'I' ? voyage.impRtDt || '' : voyage.expRtDt || '',
        });

        this.lineOptions = lines.filter(
          (ln: any) =>
            !this.addedCargoRows.some((row) => row.lineNo == ln.lndcNo)
        );
      },
    });
  }

  //File Upload
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      this.fileError = 'Only PDF files allowed.';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.fileError = 'Max size is 2MB.';
      return;
    }

    this.selectedFile = file;
    this.fileError = '';
  }

  //Adding Cargo rows in table
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
    const selected = this.form.value.line_no;
    if (!selected) return;

    const lnObj = this.lineOptions.find((l) => l.lndcNo == selected);
    if (!lnObj) return;

    this.addedCargoRows.push({
      sl: this.addedCargoRows.length + 1,
      lineNo: lnObj.lndcNo,
      cargoCode: lnObj.cargoCd,
      cargoDesc: lnObj.cargoDesc,
    });

    this.lineOptions = this.lineOptions.filter(
      (l) => l.lndcNo !== lnObj.lndcNo
    );

    this.form.patchValue({ line_no: '' });
  }

  //Removing Cargo rows from table
  removeCargoRow(i: number) {
    const removed = this.addedCargoRows[i];

    this.lineOptions.push({
      lndcNo: removed.lineNo,
      cargoCd: removed.cargoCode,
      cargoDesc: removed.cargoDesc,
    });

    this.lineOptions = [...this.lineOptions].sort(
      (a, b) => a.lndcNo - b.lndcNo
    );

    this.addedCargoRows.splice(i, 1);

    this.addedCargoRows = this.addedCargoRows.map((r, idx) => ({
      ...r,
      sl: idx + 1,
    }));
  }

  //Save func and Missing Filed Modal
  missingFields: string[] = [];

  saveForm() {
    this.missingFields = [];
    this.form.markAllAsTouched();

    const f = this.form.value;

    // Required fields
    if (!f.transMode && this.licenseType === 'APP')
      this.missingFields.push('Enter Transport Mode');

    if (!f.agent && this.licenseType === 'APP')
      this.missingFields.push('Enter Agent');

    if (!f.fromDt) this.missingFields.push('Enter From Date');

    if (!f.uptoDt) this.missingFields.push('Enter Upto Date');

    if (!f.cargoType) this.missingFields.push('Enter Cargo Type');

    if (!f.shed_location) this.missingFields.push('Enter Shed Location');

    if (!f.shedYardName) this.missingFields.push('Enter Shed Yard Name');

    if (!f.totalAppArea) this.missingFields.push('Enter Area');

    if (!this.selectedFile) this.missingFields.push('Attach a file');

    if (!f.pdf_desc) this.missingFields.push('Enter Pdf Description');

    if (!f.party_remarks) this.missingFields.push('Enter Remarks');

    // Cargo table
    if (this.addedCargoRows.length === 0)
      this.missingFields.push('Cargo Table (add at least one row)');

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

    this.saving = true;

    /** BUILD PAYLOAD */
    let wla: any = {};

    if (this.licenseType === 'APP') {
      wla = {
        vcn: this.form.value.vcn,
        purpose_cd: this.form.value.purposeCd,
        agent: this.form.value.agent,
        party_remarks: this.form.value.party_remarks,
        trans_mode: this.form.value.transMode,
        cargo_type: this.form.value.cargoType,
        shed_cd: this.form.value.shedYardName,
        from_dt: this.form.value.fromDt,
        upto_dt: this.form.value.uptoDt,
        total_app_area: this.form.value.totalAppArea,
        app_no: this.appNo,
      };
    } else if (this.licenseType === 'APL') {
      wla = {
        app_no: this.appNo,
        party_remarks: this.form.value.party_remarks || '',
        shed_cd: this.form.value.shedYardName,
        from_dt: this.form.value.fromDt,
        upto_dt: this.form.value.uptoDt,
        total_app_area: this.form.value.totalAppArea,
      };
    }

    /** TYPE-SAFE cargoList */
    let cargoList: any[] = [];

    if (this.licenseType === 'APP') {
      cargoList = this.addedCargoRows.map((row: any) => ({
        line_no: String(row.sl),
        cargo_cd: row.cargoCode,
        cargo_desc: row.cargoDesc,
      }));
    } else {
      cargoList = this.addedCargoRows.map((row: any) => ({
        cargo_cd: row.cargoCode,
        cargo_desc: row.cargoDesc,
      }));
    }

    const wlu = {
      pdf_desc: this.form.value.pdf_desc || 'Land Licence Update',
      action_flag: 'N',
    };

    const payloadJson = { wla, cargoList, wlu };

    const fd = new FormData();

    const jsonBlob = new Blob([JSON.stringify(payloadJson)], {
      type: 'application/json',
    });
    fd.append('body', jsonBlob);

    if (this.selectedFile) {
      fd.append('file', this.selectedFile, this.selectedFile.name);
    }

    let url = '';

    if (this.licenseType === 'APP') {
      url = environment.baseUrl + environment.updateOneLandLicence;
    } else if (this.licenseType === 'APL') {
      url = environment.baseUrl + environment.updateElevenMonthsLicense;
    } else {
      // alert('Unknown Application Type!');
      this.saving = false;
      return;
    }

    this.http.post(url, fd).subscribe({
      next: (res: any) => {
        this.saving = false;
        // success modal
        this.modalData.status = res?.status || 'Success';
        this.modalData.msg = res?.msg || 'Update saved successfully';
        this.modalData.app_no = res.data?.app_no;
        document.getElementById('openSuccessModalBtn')?.click();
      },
      error: (err) => {
        this.saving = false;
        const server = err?.error;

        this.modalData.status = server?.status || 'Failed';
        this.modalData.msg =
          server?.msg || err?.message || 'Failed to save update';
        document.getElementById('openFailedModalBtn')?.click();
      },
    });

    // // /** MOCKED SAVE — API CALL DISABLED */
    // this.saving = false;

    // this.modalData = {
    //   status: 'Success',
    //   msg: 'Updated successfully',
    //   app_no: 'APX25XXXXXX',
    // };

    // // trigger success modal
    // document.getElementById('openSuccessModalBtn')?.click();

    // return; // stop real call
  }

  redirectBack() {
    // Prefer relative navigation if inside dashboard
    if (this.router.url.includes('/dashboard')) {
      // Go one level up relative to current route
      this.router.navigate(['/dashboard/application/applied'], {
        relativeTo: this.route,
      });
    } else {
      // Standalone route → fallback to absolute route
      this.router.navigate(['/application/applied']);
    }
  }

  //Clear Form
  clearForm() {
    this.form.reset();
    this.addedCargoRows = [];
  }

  //Going Back
  // goBack() {
  //   this.router.navigate(['/dashboard/application/applied']);
  // }
  goBack() {
    const isInsideDashboard = this.router.url.includes('/dashboard');

    const target = isInsideDashboard
      ? ['/dashboard/application/applied']
      : ['/application/applied'];

    this.router.navigate(target);
  }
}
