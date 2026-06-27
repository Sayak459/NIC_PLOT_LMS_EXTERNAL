import { Component, OnInit } from '@angular/core';
import { MeasurementService } from 'src/app/services/measurement.service';
import { environment } from 'src/environments/environment';
import { Router, ActivatedRoute } from '@angular/router';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-one-month',
  templateUrl: './one-month.component.html',
  styleUrls: ['./one-month.component.scss'],
})
export class OneMonthComponent implements OnInit {
  measurementList: any[] = [];
  selectedRow: any = null;
  uploadFile: File | null = null;
  uploadedFileName: string = '';
  remarks: string = '';
  requestedDate: string = '';
  loading: boolean = false;
  selectedIndex: number | null = null;
  form: any = {};
  selectedFile: any;

  constructor(
    private measurementService: MeasurementService,
    private router: Router,
  ) {}

  //Oninit portion
  ngOnInit(): void {
    this.fetchMeasurements();
  }

  //Fetch measurements
  fetchMeasurements(): void {
    this.loading = true;
    this.measurementService.getOneMonthMeasurementList().subscribe({
      next: (res: any) => {
        this.measurementList = (res.data?.measurements || []).map((d: any) => ({
          appNo: d.appNo || '',
          spaceAllocNo: d.spaceAllocNo || '',
          fromDt: d.fromDt || '',
          toDt: d.toDt || '',
          actAllotArea: d.actAllotArea || '',
          requestStatus: this.mapStatus(d.reqGrantYn),
          portRemarks: d.portRemarks || '',
        }));

        this.filteredList = [...this.measurementList];

        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error fetching measurement list:', err);
        this.loading = false;
      },
    });
  }

  //Status mappers
  mapStatus(code: string): string {
    switch ((code || 'N').toUpperCase()) {
      case 'Y':
        return 'Done';
      case 'R':
        return 'Resubmit';
      case 'P':
        return 'Partial';
      case 'D':
        return 'Denied';
      case 'A':
        return 'Applied';
      case 'N':
      default:
        return 'Pending';
    }
  }

  //Status class bg
  getStatusClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'done':
        return 'bg-success text-white';
      case 'denied':
        return 'bg-danger text-white';
      case 'resubmit':
        return 'bg-primary text-white';
      case 'partial':
        return 'bg-secondary text-white';
      case 'applied':
        return 'bg-info text-white';
      case 'pending':
      default:
        return 'bg-warning text-dark';
    }
  }

  //Sorting section
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  sortTable(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    const direction = this.sortDirection === 'asc' ? 1 : -1;

    this.filteredList.sort((a: any, b: any) => {
      const x = a[column] ?? '';
      const y = b[column] ?? '';

      // For numeric values
      if (!isNaN(Number(x)) && !isNaN(Number(y))) {
        return (Number(x) - Number(y)) * direction;
      }

      // For dates
      if (Date.parse(x) && Date.parse(y)) {
        return (new Date(x).getTime() - new Date(y).getTime()) * direction;
      }

      // For text values
      return String(x).localeCompare(String(y)) * direction;
    });
  }

  //Row selectable
  isRowSelectable(row: any): boolean {
    const status = (row.requestStatus || '').toLowerCase();
    // Only allow Pending or Resubmit rows
    return (
      status === 'pending' ||
      status === 'resubmit' ||
      status === 'applied' ||
      status === 'partial'
    );
  }

  //Update row
  onRowUpdate(row: any) {
    if (!this.isRowSelectable(row)) {
      alert('Cannot update. Only Pending or Resubmit requests can be updated.');
      return;
    }

    // Detect dashboard mode
    const isInsideDashboard = this.router.url.includes('/dashboard');

    const target = isInsideDashboard
      ? ['/dashboard/measurement/one-month/update', row.appNo]
      : ['/measurement/one-month/update', row.appNo];

    this.router.navigate(target);
  }

  //Search portion
  globalSearch = '';
  filteredList: any[] = [];

  filterTable(): void {
    const search = this.globalSearch.toLowerCase().trim();

    this.filteredList = this.measurementList.filter((row) => {
      const values = [
        row.appNo,
        row.spaceAllocNo,
        this.formatDate(row.fromDt),
        this.formatDate(row.toDt),
        row.actAllotArea,
        row.requestStatus,
        row.portRemarks,
      ];

      return values.some((v) =>
        String(v ?? '')
          .toLowerCase()
          .includes(search),
      );
    });
  }

  //Clear search
  clearSearch(): void {
    this.globalSearch = '';
    this.filteredList = [...this.measurementList];
  }

  //Download section
  private getTableHeaders(): string[] {
    const table = document.querySelector('table');
    if (!table) return [];

    const ths = Array.from(table.querySelectorAll('thead th'));

    // Exclude Update column
    return ths
      .map((th) => th.textContent?.trim() || '')
      .filter((h) => h && h !== 'Update');
  }

  private formatDate(val: any): string {
    if (!val) return '';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB');
  }

  private getRowValues(row: any): any[] {
    const headers = this.getTableHeaders();

    return headers.map((header) => {
      const extractor = this.columnMap[header];
      return extractor ? extractor(row) : '';
    });
  }

  private columnMap: Record<string, (row: any) => any> = {
    'Application No.': (row) => row.appNo ?? '',
    'Space Allocation No.': (row) => row.spaceAllocNo ?? '',
    'From Date': (row) => this.formatDate(row.fromDt),
    'Upto Date': (row) => this.formatDate(row.toDt),
    'Current Area (SqM)': (row) => row.actAllotArea ?? '',
    'Request Status': (row) => row.requestStatus ?? '',
    'Port Remarks': (row) => row.portRemarks ?? '',
  };

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
    doc.text('Measurement List', pageWidth / 2, 25, { align: 'center' });

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

    doc.save('measurement.pdf');
  }

  downloadCSV(): void {
    const headers = this.getTableHeaders();

    const data = this.filteredList.map((row) => {
      const values = this.getRowValues(row);
      const obj: any = {};

      headers.forEach((h, i) => {
        const val = values[i];

        // Force date as text to avoid #### in Excel
        obj[h] =
          typeof val === 'string' && val.includes('/') ? `"${val}"` : val;
      });

      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    saveAs(blob, 'measurement.csv');
  }

  downloadExcel(): void {
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
    const workbook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/octet-stream',
    });

    saveAs(blob, 'measurement.xlsx');
  }

  //Go back section
  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
