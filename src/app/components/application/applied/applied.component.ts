import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationService } from 'src/app/services/application.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

interface YnStatus {
  code: string;
  text: string;
  cls: string;
}

@Component({
  selector: 'app-applied',
  templateUrl: './applied.component.html',
  styleUrls: ['./applied.component.scss'],
})
export class AppliedComponent implements OnInit {
  applications: any[] = [];
  loading = true;

  updateForm!: FormGroup;

  selectedRows: Set<number> = new Set();
  selectedAppNo: string = '';

  constructor(
    private router: Router,
    private appService: ApplicationService,
    private fb: FormBuilder,
    private http: HttpClient,
  ) {}

  //OnInit Section
  ngOnInit(): void {
    this.appService.getApplications().subscribe({
      next: (res: any) => {
        if (res.status === 'Success' && res.data?.applications) {
          this.applications = res.data.applications.map((a: any) => ({
            appNo: a.appNo,
            vcn: a.vcn,
            purposeCd: a.purposeCd,
            shedYardName: a.shedYardName,
            totalAppArea: a.totalAppArea,
            fromDt: a.fromDt,
            uptoDt: a.uptoDt,
            transMode: a.transMode,
            shed_cd: a.shedCd,
            agent: a.agent,
            cargoType: a.cargoType,
            verifyYn: this.mapYn(a.verifyYn),
            approveYn: this.mapYn(a.approveYn),
            dyVerifyYn: this.mapYn(a.dyVerifyYn),
            appGrantYn: this.mapYn(a.appGrantYn),
            verifyRemark: a.verifyRemark,
            lmsLoc: a.lmsLoc,
            overallStatus: this.deriveOverallStatus(a),
          }));
          this.filteredList = [...this.applications];
        }
        this.loading = false;
        this.initUpdateForm();
      },
      error: (err: any) => {
        console.error('Error fetching applications:', err);
        this.loading = false;
      },
    });
  }

  //Loading In Form
  initUpdateForm(): void {
    this.updateForm = this.fb.group({
      vcn: [''],
      purposeCd: [''],
      agent: [''],
      shedCd: [''],
      fromDt: ['', Validators.required],
      uptoDt: ['', Validators.required],
      party_remarks: [''],
    });
  }

  //Mappers

  // PURPOSE
  purposes: Record<string, string> = {
    I: 'Import',
    E: 'Export',
    S: 'Stock',
  };

  // TRANSPORT MODE
  transModes: Record<string, string> = {
    S: 'Vessel',
    V: 'Road',
    R: 'Rail',
    B: 'Barge',
  };

  // CARGO TYPE
  cargoTypes: Record<string, string> = {
    G: 'General',
    N: 'Nepal',
    B: 'Bhutan',
  };

  // AGENT
  agents: Record<string, string> = {
    NONE: 'Select Agent',
    S: 'Steamer Agent',
    C: 'Clearing Agent',
    I: 'Importer',
    H: 'Handling Agent',
    E: 'Exporter',
    T: 'Stevedore',
  };

  //Status
  mapYn(code: string): YnStatus {
    const c = (code || 'N').toUpperCase();
    switch (c) {
      case 'Y':
        return { code: 'Y', text: 'Done', cls: 'bg-success text-white' };
      case 'R':
        return { code: 'R', text: 'Resubmit', cls: 'bg-primary text-white' };
      case 'P':
        return { code: 'P', text: 'Partial', cls: 'bg-secondary text-white' };
      case 'D':
        return { code: 'D', text: 'Denied', cls: 'bg-danger text-white' };
      case 'N':
      default:
        return { code: 'N', text: 'Pending', cls: 'bg-warning text-dark' };
    }
  }

  //Status Checking
  deriveOverallStatus(app: any): YnStatus {
    const codes = [
      app.approveYn?.code,
      app.verifyYn?.code,
      app.dyVerifyYn?.code,
      app.appGrantYn?.code,
    ].map((x: any) => (x || '').toUpperCase());

    if (codes.includes('D')) return this.mapYn('D');
    if (codes.includes('R')) return this.mapYn('R');
    if (codes.includes('P')) return this.mapYn('P');
    if (codes.includes('Y')) return this.mapYn('Y');
    return this.mapYn('N');
  }

  //Checking if row is selectable
  isRowSelectable(app: any): boolean {
    return app.verifyYn.code === 'N' || app.verifyYn.code === 'R';
  }

  //Table Sorting Section
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  sortTable(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    const direction = this.sortDirection === 'asc' ? 1 : -1;

    this.filteredList.sort((a: any, b: any) => {
      let x = a[column];
      let y = b[column];

      // If the value is an object (status), compare by .text
      if (x && typeof x === 'object' && 'text' in x) {
        x = x.text;
      }
      if (y && typeof y === 'object' && 'text' in y) {
        y = y.text;
      }

      // For numeric values
      if (!isNaN(Number(x)) && !isNaN(Number(y))) {
        return (Number(x) - Number(y)) * direction;
      }

      // For dates
      if (Date.parse(x) && Date.parse(y)) {
        return (new Date(x).getTime() - new Date(y).getTime()) * direction;
      }

      // Text compare
      return String(x).localeCompare(String(y)) * direction;
    });
  }

  //Search portion
  globalSearch = '';
  filteredList: any[] = [];

  //Filter section
  filterTable(): void {
    const search = this.globalSearch.toLowerCase().trim();

    this.filteredList = this.applications.filter((row) => {
      const values = [
        row.appNo,
        row.vcn,
        this.purposes[row.purposeCd] || row.purposeCd,
        row.shedYardName,
        row.totalAppArea,
        this.formatDate(row.fromDt),
        this.formatDate(row.uptoDt),
        this.transModes[row.transMode] || row.transMode,
        this.agents[row.agent] || row.agent,
        this.cargoTypes[row.cargoType] || row.cargoType,
        row.verifyYn?.text,
        row.approveYn?.text,
        row.dyVerifyYn?.text,
        row.overallStatus?.text,
      ];

      return values.some((v) =>
        String(v ?? '')
          .toLowerCase()
          .includes(search),
      );
    });
  }

  //Clear section
  clearSearch(): void {
    this.globalSearch = '';
    this.filteredList = [...this.applications];
  }

  //Update button section
  onRowUpdate(app: any): void {
    const isInsideDashboard = this.router.url.includes('/dashboard');

    const targetRoute = isInsideDashboard
      ? ['/dashboard/application/applied/update-form', app.appNo]
      : ['/application/applied/update-form', app.appNo];

    this.router.navigate(targetRoute, {
      state: {
        ...app,
        appNo: app.appNo,
        purposeCd: app.purposeCd,
        cargoType: app.cargoType,
        verifyRemark: app.verifyRemark || '',
        shed_cd: app.shed_cd,
        totalAppArea: app.totalAppArea,
        lmsLoc: app.lmsLoc,
      },
    });
  }

  //Back button section
  goBack() {
    this.router.navigate(['/dashboard']);
  }

  //Download Section
  private getTableHeaders(): string[] {
    const table = document.querySelector('table'); // or use class/id if exists
    if (!table) return [];

    const ths = Array.from(table.querySelectorAll('thead th'));
    return ths.map((th) => th.textContent?.trim() || '');
  }

  private getRowValues(row: any): any[] {
    const headers = this.getTableHeaders();

    return headers.map((header) => {
      const extractor = this.columnMap[header];
      return extractor ? extractor(row) : '';
    });
  }

  downloadPDF(): void {
    if (!this.filteredList?.length) return;

    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // ---- LOGOS ----
    const smpkLogo = new Image();
    smpkLogo.src = 'assets/smpk.png';

    const nicLogo = new Image();
    nicLogo.src = 'assets/nic.png';

    // Left logo (SMPK)
    doc.addImage(smpkLogo, 'PNG', 10, 5, 24, 20);

    // Right logo (NIC) - resized to match height visually
    doc.addImage(nicLogo, 'PNG', pageWidth - 35, 5, 30, 20);

    // ---- MAIN HEADING ----
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(
      'Syama Prasad Mookerjee Port Kolkata Dock System, Kolkata',
      pageWidth / 2,
      14,
      {
        align: 'center',
      },
    );

    // ---- SUB HEADING ----
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Applied Application List', pageWidth / 2, 25, {
      align: 'center',
    });

    const headers = this.getTableHeaders();
    const data = this.filteredList.map((row) => this.getRowValues(row));

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 28,

      styles: {
        fontSize: 7,
        cellPadding: 2,
        valign: 'middle',
        halign: 'center',
        overflow: 'linebreak',
        lineWidth: 0.2, // ✅ BORDER WIDTH
        lineColor: [0, 0, 0], // ✅ BORDER COLOR
      },

      headStyles: {
        fillColor: [25, 135, 84],
        textColor: 255,
        fontStyle: 'bold',
        lineWidth: 0.2, // ✅ HEADER GRID
        lineColor: [0, 0, 0],
      },

      bodyStyles: {
        lineWidth: 0.2, // ✅ BODY GRID
        lineColor: [0, 0, 0],
      },

      tableLineWidth: 0.2, // ✅ FULL TABLE BORDER
      tableLineColor: [0, 0, 0],

      margin: { left: 5, right: 5 },
      pageBreak: 'auto',
    });

    doc.save('applied-applications.pdf');
  }

  downloadCSV(): void {
    const headers = this.getTableHeaders();

    const data = this.filteredList.map((row) => {
      const values = this.getRowValues(row);
      const obj: any = {};

      headers.forEach((h, i) => {
        const val = values[i];
        obj[h] =
          typeof val === 'string' && val.includes('/') ? `"${val}"` : val;
      });

      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    saveAs(blob, 'applied-applications.csv');
  }

  downloadExcel() {
    const headers = this.getTableHeaders();

    const data = this.filteredList.map((row) => {
      const values = this.getRowValues(row);
      const obj: any = {};

      headers.forEach((h, i) => {
        obj[h] = values[i];
      });

      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/octet-stream',
    });

    saveAs(blob, 'applied-applications.xlsx');
  }

  private columnMap: Record<string, (row: any) => string> = {
    'Application No.': (row) => row.appNo ?? '',
    VCN: (row) => row.vcn ?? '',
    Purpose: (row) => this.purposes[row.purposeCd] || row.purposeCd || '',
    'Shed/Yard': (row) => row.shedYardName ?? '',
    'Applied Area (SqM)': (row) => row.totalAppArea ?? '',
    'From Date': (row) => this.formatDate(row.fromDt),
    'Upto Date': (row) => this.formatDate(row.uptoDt),
    'Transport Mode': (row) =>
      this.transModes[row.transMode] || row.transMode || '',
    Agent: (row) => this.agents[row.agent] || row.agent || '',
    'Cargo Type': (row) =>
      this.cargoTypes[row.cargoType] || row.cargoType || '',
    Verify: (row) => row.verifyYn?.text || '',
    Approve: (row) => row.approveYn?.text || '',
    DyVerify: (row) => row.dyVerifyYn?.text || '',
    'Application Status': (row) => row.overallStatus?.text || '',
  };

  private formatDate(val: any): string {
    if (!val) return '';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB'); // dd/MM/yyyy
  }
}
