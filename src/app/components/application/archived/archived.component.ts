import { Component, OnInit } from '@angular/core';
import { ApplicationService } from 'src/app/services/application.service';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-archived',
  templateUrl: './archived.component.html',
  styleUrls: ['./archived.component.scss'],
})
export class ArchivedComponent implements OnInit {
  archivedApplications: any[] = [];
  loading = true;

  constructor(
    private appService: ApplicationService,
    private router: Router,
  ) {}

  //OnInit Portion
  ngOnInit(): void {
    this.appService.getActiveApplications('N').subscribe({
      next: (res: any) => {
        if (res.status === 'Success' && res.data?.applications) {
          this.archivedApplications = res.data.applications.map((a: any) => ({
            appNo: a.appNo,
            vcn: a.vcn,
            spaceAllocNo: a.spaceAllocNo,
            purposeCd: this.mapPurpose(a.purposeCd),
            shedYardName: a.shedYardName,
            totAllotArea: a.totAllotArea,
            actAllotArea: a.actAllotArea,
            fromDt: a.fromDt,
            toDt: a.toDt,
            allotDt: a.allotDt,
            transMode: this.mapTransMode(a.transMode),
            cargoType: this.mapCargoType(a.cargoType),
            handoverStatus: this.mapStatus(a.handoverFlg),
            releaseStatus: this.mapStatus(a.releaseFlg),
            refundStatus: this.mapStatus(a.refundYn),
            refundApproveStatus: this.mapStatus(a.refundApproveYn),
            handoverDt: a.handoverDt,
            releaseDt: a.releaseDt,
          }));

          this.filteredList = [...this.archivedApplications];
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error fetching archived applications:', err);
        this.loading = false;
      },
    });
  }

  //Mappers
  mapPurpose(code: string): string {
    const map: any = { I: 'Import', E: 'Export', S: 'Stock' };
    return map[code] || code || '';
  }

  mapTransMode(code: string): string {
    const map: any = { S: 'Vessel', V: 'Road', R: 'Rail', B: 'Barge' };
    return map[code] || code || '';
  }

  mapCargoType(code: string): string {
    const map: any = { G: 'General', N: 'Nepal', B: 'Bhutan' };
    return map[code] || code || '';
  }

  mapStatus(flag: string): { text: string; cls: string } {
    const code = (flag || 'N').toUpperCase();

    const map: any = {
      Y: { text: 'Done', cls: 'bg-success text-white' },
      N: { text: 'Pending', cls: 'bg-warning text-dark' },
      P: { text: 'Partial', cls: 'bg-secondary text-white' },
      D: { text: 'Denied', cls: 'bg-danger text-white' },
      R: { text: 'Resubmit', cls: 'bg-primary text-white' },
      A: { text: 'Approved', cls: 'bg-info text-white' },
      F: { text: 'Forfeit', cls: 'bg-dark text-white' },
    };

    return map[code] || { text: code, cls: 'bg-warning text-dark' };
  }

  //Table Sorting Section
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

  //Filter Table
  filterTable(): void {
    const search = this.globalSearch.toLowerCase().trim();

    this.filteredList = this.archivedApplications.filter((row) => {
      const values = [
        row.appNo,
        row.spaceAllocNo,
        row.vcn,
        row.purposeCd, // already mapped
        row.shedYardName,
        row.totAllotArea,
        row.actAllotArea,
        this.formatDate(row.fromDt),
        this.formatDate(row.toDt),
        this.formatDate(row.allotDt),
        row.transMode, // already mapped
        row.cargoType, // already mapped
        this.formatDate(row.handoverDt),
        this.formatDate(row.releaseDt),
        row.handoverStatus?.text,
        row.releaseStatus?.text,
        row.refundStatus?.text,
        row.refundApproveStatus?.text,
      ];

      return values.some((v) =>
        String(v ?? '')
          .toLowerCase()
          .includes(search),
      );
    });
  }

  //Clear Search
  clearSearch(): void {
    this.globalSearch = '';
    this.filteredList = [...this.archivedApplications];
  }

  //Back button
  goBack() {
    this.router.navigate(['/dashboard']);
  }

  //Download Section

  private getTableHeaders(): string[] {
    const table = document.querySelector('table');
    if (!table) return [];

    const ths = Array.from(table.querySelectorAll('thead th'));
    return ths.map((th) => th.textContent?.trim() || '');
  }

  private formatDate(val: any): string {
    if (!val) return '';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB'); // dd/MM/yyyy
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
    SAN: (row) => row.spaceAllocNo ?? '',
    VCN: (row) => row.vcn ?? '',
    Purpose: (row) => row.purposeCd ?? '',
    'Shed/Yard': (row) => row.shedYardName ?? '',
    'Applied Area (SqM)': (row) => row.totAllotArea ?? '',
    'From Date': (row) => this.formatDate(row.fromDt),
    'Upto Date': (row) => this.formatDate(row.toDt),
    'Allot Date': (row) => this.formatDate(row.allotDt),
    'Transport Mode': (row) => row.transMode ?? '',
    'Cargo Type': (row) => row.cargoType ?? '',
    'Handover Date': (row) => this.formatDate(row.handoverDt),
    'Release Date': (row) => this.formatDate(row.releaseDt),
    'Release Status': (row) => row.releaseStatus?.text ?? '',
    'Refund Approve Status': (row) => row.refundApproveStatus?.text ?? '',
    'Refund Status': (row) => row.refundStatus?.text ?? '',
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
    doc.text('Archived Application List', pageWidth / 2, 25, {
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

    doc.save('Archived-applications.pdf');
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

    saveAs(blob, 'archived-applications.csv');
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

    saveAs(blob, 'archived-applications.xlsx');
  }
}
