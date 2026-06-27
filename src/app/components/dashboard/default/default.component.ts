import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  NgZone,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ApplicationService } from 'src/app/services/application.service';
import { MapService } from 'src/app/services/map.service';
import Chart from 'chart.js/auto';
import { PartyService } from 'src/app/services/party.service';

// Add this interface at the top of your file
interface Shed {
  shedCd: string;
  shedYardName: string;
  totalArea: number;
  occupiedArea: number;
  vacantArea: number;
  holdArea: number;
  excessArea: number;
  occupiedPercent: number;
  vacantPercent: number;
  holdPercent: number;
  excessPercent: number;
}
@Component({
  selector: 'app-default',
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss'],
})
export class DefaultComponent implements OnInit, AfterViewInit {
  @ViewChild('allotmentChart') chartRef!: ElementRef;

  @ViewChild('applicationPieChart') pieChartRef!: ElementRef;
  pieChart: any;

  @ViewChild('shedPieChart') shedPieChartRef!: ElementRef;
  shedPieChart: any;

  // SECOND PIE CHART (on Applied click)
  @ViewChild('appliedDetailPieChart') appliedDetailPieChartRef!: ElementRef;
  appliedDetailPieChart: any;

  appliedStatusCounts = {
    DENIED: 0,
    APPLIED: 0,
    PENDING: 0,
    RESUBMIT: 0,
    PARTIAL: 0,
    DONE: 0,
  };

  expiringList: any[] = [];

  sheds: Shed[] = [];

  partyDetails: any = null;

  activeApplications: any[] = [];
  archivedApplications: any[] = [];

  fromMonth: string = '';
  toMonth: string = '';

  chart: any;

  //Chart 3
  appliedCount = 0;
  activeCount = 0;
  archivedCount = 0;
  totalApplications = 0;

  // Chart 4 - Party PDA Pie
  partyPdaChart: any;

  partyBalance = 0;
  partyMinBalance = 0;
  partyExistingBill = 0;
  partyTotal = 0;
  partysecurity = 0;
  partyRemaining = 0;

  viewReady = false;

  showAppliedDetailChart = false;

  constructor(
    private appService: ApplicationService,
    private mapService: MapService,
    private partyService: PartyService,
    private zone: NgZone,
  ) {}

  //Oninit portion
  ngOnInit() {
    this.loadExpiringApplications();
    //added
    this.loadApplications();

    this.loadApplicationSummary();

    this.loadPartyPdaChart();

    // Delay chart rendering until both active + archived applications are loaded
    const checkDataLoaded = setInterval(() => {
      if (this.activeApplications.length || this.archivedApplications.length) {
        clearInterval(checkDataLoaded);
        this.renderLast12Months(); // initial chart for last 12 months
      }
    }, 100);
  }

  //AfterViewInit portion
  ngAfterViewInit(): void {
    this.loadSheds();
  }

  //Chart 1
  loadExpiringApplications() {
    this.appService.getActiveApplications('Y').subscribe({
      next: (res: any) => {
        if (res.status === 'Success' && res.data?.applications) {
          const today = new Date();
          this.expiringList = res.data.applications
            .map((a: any) => {
              const upto = new Date(a.toDt);
              const diff = Math.ceil(
                (upto.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
              );
              return {
                appNo: a.appNo,
                san: a.spaceAllocNo,
                fromDate: a.fromDt,
                uptoDate: a.toDt,
                remainingDays: diff,
                status: this.getStatus(diff),
              };
            })
            .filter((x: { remainingDays: number }) => x.remainingDays <= 7);
        }
      },
      error: (err) => console.error(err),
    });
  }

  //Status getter for Chart 1
  getStatus(days: number): string {
    if (days < 0) return 'Overdue';
    if (days >= 0 && days <= 7) return 'Warning';
    return '';
  }

  //Shed list loaders
  loadSheds() {
    this.mapService.getOccupancyDetails().subscribe({
      next: (res: any) => {
        if (res.status === 'Success' && res.data?.shedDetails) {
          this.sheds = res.data.shedDetails.map((shed: any) => {
            const total = shed.totalArea || 1; // avoid division by zero
            const occupied = shed.occupiedArea || 0;
            const vacant = shed.vacantArea || 0;
            const hold = shed.holdArea || 0;
            const excess = shed.excessArea || 0;

            return {
              shedCd: shed.shedCd,
              shedYardName: shed.shedYardName.trim(),
              totalArea: total,
              occupiedArea: occupied,
              vacantArea: vacant,
              holdArea: hold,
              excessArea: excess,
              occupiedPercent: Math.round((occupied / total) * 100),
              vacantPercent: Math.round((vacant / total) * 100),
              holdPercent: Math.round((hold / total) * 100),
              excessPercent: Math.round((excess / total) * 100),
            };
          });
        }
      },
      error: (err) => console.error('Error fetching sheds', err),
    });
  }

  //Chart 2 line charts
  loadApplications() {
    this.appService.getActiveApplications('Y').subscribe({
      next: (res: any) => {
        if (res.status === 'Success' && res.data?.applications) {
          this.activeApplications = res.data.applications.map((a: any) => ({
            allotDt: a.allotDt,
          }));
        }
      },
      error: (err) => console.error(err),
    });

    this.appService.getActiveApplications('N').subscribe({
      next: (res: any) => {
        if (res.status === 'Success' && res.data?.applications) {
          this.archivedApplications = res.data.applications.map((a: any) => ({
            allotDt: a.allotDt,
          }));
        }
      },
      error: (err) => console.error(err),
    });
  }

  //Filter line chart according to dates
  filterAllotments() {
    if (!this.fromMonth || !this.toMonth) return;

    const start = new Date(this.fromMonth + '-01');
    const end = new Date(this.toMonth + '-01');

    const allApplications = [
      ...this.activeApplications,
      ...this.archivedApplications,
    ];

    const months: string[] = [];
    const counts: number[] = [];
    const temp = new Date(start);

    while (temp <= end) {
      const key = temp.toISOString().slice(0, 7);
      months.push(key);
      counts.push(
        allApplications.filter((a) => a.allotDt?.startsWith(key)).length,
      );
      temp.setMonth(temp.getMonth() + 1);
    }

    const labels = months.map((m) => this.formatMonth(m));
    this.renderChart(labels, counts);
  }

  //Month formatter for line chart
  formatMonth(ym: string): string {
    const dt = new Date(ym + '-01');
    return dt.toLocaleString('default', { month: 'short', year: 'numeric' });
  }

  //Line chart renderer
  renderChart(labels: string[], data: number[]) {
    if (!this.chartRef) return;
    const ctx = this.chartRef.nativeElement.getContext('2d');
    if (this.chart) this.chart.destroy();

    // Gradient for mountain effect
    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(0, 123, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 123, 255, 0)');

    // Start with all zeros
    const animatedData = Array(data.length).fill(0);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Allotments',
            data: animatedData,
            fill: true,
            backgroundColor: gradient,
            borderColor: 'rgba(0, 123, 255, 1)',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: 'rgba(0, 123, 255, 1)',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
        },
      },
    });

    // Smoothly animate each point
    let index = 0;

    const animatePoint = (
      target: number,
      dataArray: number[],
      i: number,
      steps = 20,
      intervalMs = 15,
    ) => {
      let step = 0;
      const increment = target / steps;

      const anim = setInterval(() => {
        dataArray[i] += increment;
        this.chart.update('none'); // redraw without default animation
        step++;
        if (step >= steps) {
          dataArray[i] = target; // ensure exact final value
          this.chart.update('none');
          clearInterval(anim);
          // Animate next point
          index++;
          if (index < data.length) {
            animatePoint(data[index], animatedData, index);
          }
        }
      }, intervalMs);
    };

    // Start animation with first point
    animatePoint(data[0], animatedData, 0);
  }

  //Initial render for last 12 months
  renderLast12Months() {
    const allApplications = [
      ...this.activeApplications,
      ...this.archivedApplications,
    ];

    const months: string[] = [];
    const counts: number[] = [];

    const today = new Date();
    const temp = new Date(today.getFullYear(), today.getMonth(), 1);

    // Loop last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date(temp.getFullYear(), temp.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7); // YYYY-MM
      months.push(key);
      counts.push(
        allApplications.filter((a) => a.allotDt?.startsWith(key)).length,
      );
    }

    // Pre-fill input fields
    this.fromMonth = months[0];
    this.toMonth = months[months.length - 1];

    const labels = months.map((m) => this.formatMonth(m));
    this.renderChart(labels, counts);
  }

  //Chart 3 first pie
  loadApplicationSummary() {
    // Applied
    // Applied
    this.appService.getApplications().subscribe({
      next: (res: any) => {
        const apps = res.data?.applications || [];
        this.appliedCount = apps.length;

        // ⭐ COUNT verifyYn statuses for the second pie
        this.appliedStatusCounts = {
          DENIED: 0,
          APPLIED: 0,
          PENDING: 0,
          RESUBMIT: 0,
          PARTIAL: 0,
          DONE: 0,
        };

        apps.forEach((a: any) => {
          const code = (a.verifyYn || '').trim().toUpperCase();

          switch (code) {
            case 'D':
              this.appliedStatusCounts.DENIED++;
              break;
            case 'A':
              this.appliedStatusCounts.APPLIED++;
              break;
            case 'N':
              this.appliedStatusCounts.PENDING++;
              break;
            case 'R':
              this.appliedStatusCounts.RESUBMIT++;
              break;
            case 'P':
              this.appliedStatusCounts.PARTIAL++;
              break;
            case 'Y':
              this.appliedStatusCounts.DONE++;
              break;

            default:
              console.warn('Unknown verifyYn:', code);
          }
        });

        this.updatePieTotals();
      },
    });

    // Active
    this.appService.getActiveApplications('Y').subscribe({
      next: (res: any) => {
        this.activeCount = res.data?.applications?.length || 0;
        this.updatePieTotals();
      },
    });

    // Archived
    this.appService.getActiveApplications('N').subscribe({
      next: (res: any) => {
        this.archivedCount = res.data?.applications?.length || 0;
        this.updatePieTotals();
      },
    });
  }

  //Update pie totals
  updatePieTotals() {
    this.totalApplications =
      this.appliedCount + this.activeCount + this.archivedCount;

    this.renderApplicationPieChart();
  }

  //Pie chart renderer
  renderApplicationPieChart() {
    if (!this.pieChartRef) return;
    const ctx = this.pieChartRef.nativeElement.getContext('2d');

    if (this.pieChart) this.pieChart.destroy();

    this.pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Applied', 'Active', 'Archived'],
        datasets: [
          {
            data: [this.appliedCount, this.activeCount, this.archivedCount],

            backgroundColor: [
              'rgba(54, 162, 235, 0.85)', // Applied
              'rgba(53, 220, 95, 0.8)', // Active
              'rgba(255, 193, 7, 0.85)', // Archived
            ],

            borderColor: [
              'rgba(54, 162, 235, 1)',
              'rgba(53, 220, 95, 0.8)',
              'rgba(255, 193, 7, 1)',
            ],

            borderWidth: 1,

            // 🔥 Hover pop-out animation (type-safe & official)
            hoverOffset: 25,
          },
        ],
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        // 🔥 Beautiful loading animation
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1400,
          easing: 'easeOutQuint',
        },

        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
            },
          },
          tooltip: {
            enabled: true,
          },
        },
        onClick: (event: any, elements: any[]) => {
          if (!elements.length) return;

          const index = elements[0].index;
          const label = this.pieChart.data.labels[index];

          if (label === 'Applied') {
            this.zone.run(() => {
              this.showAppliedDetailChart = true;
              setTimeout(() => this.renderAppliedDetailPieChart(), 50);
            });
          }
        },
      },
    });
  }

  //Hide detail pie chart
  hideDetailPie() {
    this.zone.run(() => {
      this.showAppliedDetailChart = false;
      setTimeout(() => this.renderApplicationPieChart(), 50);
    });
  }

  //Chart 3 second pie
  renderAppliedDetailPieChart() {
    if (!this.appliedDetailPieChartRef) return;

    const ctx = this.appliedDetailPieChartRef.nativeElement.getContext('2d');

    if (this.appliedDetailPieChart) {
      this.appliedDetailPieChart.destroy();
    }

    const { DENIED, APPLIED, PENDING, RESUBMIT, PARTIAL, DONE } =
      this.appliedStatusCounts;

    this.appliedDetailPieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Denied', 'Applied', 'Pending', 'Resubmit', 'Partial', 'Done'],
        datasets: [
          {
            data: [DENIED, APPLIED, PENDING, RESUBMIT, PARTIAL, DONE],
            backgroundColor: [
              '#dc3545',
              '#8f0cccff',
              '#f6c23e',
              '#858796',
              '#20c997',
              '#0d6efd',
            ],
            borderColor: [
              '#dc3545',
              '#8f0cccff',
              '#f6c23e',
              '#858796',
              '#20c997',
              '#0d6efd',
            ],
            borderWidth: 1,
            hoverOffset: 25, // pop-out effect like Party PDA pie
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1400,
          easing: 'easeOutQuint',
        },
        layout: {
          padding: {
            top: 10,
            bottom: 30, // more space for the legend
          },
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 8,
              boxWidth: 15,
              usePointStyle: true,
              font: { size: 10 }, // smaller font
            },
          },
          tooltip: { enabled: true },
        },
        // Control the pie radius to make it smaller
        radius: '80%',
      },
    });
  }

  // Called on leaving the detailed pie area
  onDetailMouseLeave() {
    // hide the detail and re-render main pie
    this.zone.run(() => {
      this.showAppliedDetailChart = false;
      // small delay so canvas toggles complete
      setTimeout(() => this.renderApplicationPieChart(), 40);
    });
  }

  //Chart 4 pie
  loadPartyPdaChart() {
    this.partyService.getPartyPdaDetails().subscribe({
      next: (res: any) => {
        if (res.status === 'Success' && res.data) {
          this.partyDetails = res.data.partyPdaDetails;

          this.partyBalance = res.data.partyPdaDetails.pdaBalance || 0;
          this.partyMinBalance = res.data.partyPdaDetails.minBalance || 0;
          this.partyExistingBill = res.data.partyPdaDetails.totalEstBill || 0;
          this.partysecurity = res.data.partyPdaDetails.totalEstSecurity || 0;

          this.partyRemaining =
            this.partyBalance -
            this.partyMinBalance -
            this.partyExistingBill -
            this.partysecurity;

          this.renderPartyPdaPieChart();
        }
      },
      error: (err) => console.error('Error loading PDA details', err),
    });
  }

  //Pie chart renderer
  renderPartyPdaPieChart() {
    if (!this.shedPieChartRef) return;

    const ctx = this.shedPieChartRef.nativeElement.getContext('2d');
    if (this.partyPdaChart) this.partyPdaChart.destroy();

    this.partyPdaChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: [
          'Remaining Balance',
          'Min Balance',
          'Blocked Bill',
          'Blocked Security',
        ],
        datasets: [
          {
            data: [
              this.partyRemaining,
              this.partyMinBalance,
              this.partyExistingBill,
              this.partysecurity,
            ],
            backgroundColor: [
              'rgba(0, 123, 255, 0.8)', // balance
              'rgba(255, 193, 7, 0.8)', // min bal
              'rgba(220, 53, 69, 1)', // bill
              'rgba(53, 220, 95, 0.8)',
            ],
            borderColor: [
              'rgba(0, 123, 255, 1)',
              'rgba(255, 193, 7, 1)',
              'rgba(220, 53, 69, 1)',
              'rgba(53, 220, 95, 0.8)',
            ],
            borderWidth: 1,
            hoverOffset: 25,
          },
        ],
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1300,
          easing: 'easeOutQuint',
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 12 },
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: (tooltipItem) => {
                const value = Number(tooltipItem.raw);
                return '₹' + value.toLocaleString();
              },
            },
          },
        },
      },
    });
  }
}
