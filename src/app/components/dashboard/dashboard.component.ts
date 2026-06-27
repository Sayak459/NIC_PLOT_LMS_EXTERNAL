import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ApplicationService } from 'src/app/services/application.service';
import { MeasurementService } from 'src/app/services/measurement.service';
import { RenewalService } from 'src/app/services/renewal.service';
import { HandoverService } from 'src/app/services/handover.service';
import { PartyService } from 'src/app/services/party.service';
import { VideoService } from 'src/app/services/video.service';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { filter } from 'rxjs/operators';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  showInfoNote: boolean = true;

  //Total counts
  totalApplications = 0;
  totalMeasurements = 0;
  totalRenewals = 0;
  totalHandovers = 0;

  partyDetails: any = null;

  appliedCount = 0;
  activeCount = 0;
  archivedCount = 0;
  resubmitDeniedCount = 0;

  //Separate Inner counts
  measurementResubmitDeniedCount = 0;
  remeasurementResubmitDeniedCount = 0;

  fullHandoverResubmitDeniedCount = 0;
  partialHandoverResubmitDeniedCount = 0;
  normalHandoverResubmitDeniedCount = 0;

  showChildCard = false;

  //Shed counts
  totalSheds = 0;
  totalBlocks = 0;
  occupiedBlocks = 0;
  holdBlocks = 0;
  vacantBlocks = 0;

  firstLoad: boolean = true;
  video: HTMLVideoElement | undefined;
  videoLoading: any;

  constructor(
    private appService: ApplicationService,
    private measurementService: MeasurementService,
    private renewalService: RenewalService,
    private handoverService: HandoverService,
    private partyService: PartyService,
    private router: Router,
    private http: HttpClient,
    private videoservice: VideoService,
    private sanitizer: DomSanitizer,
  ) {}

  //Oninit portion
  ngOnInit(): void {
    // this.loadVideo();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const currentUrl = event.urlAfterRedirects || this.router.url;
        this.showChildCard = !currentUrl.endsWith('/dashboard');

        if (currentUrl === '/dashboard') {
          this.loadAllData();
          this.loadShedStats();
        }
      });

    if (this.router.url === '/dashboard') {
      this.loadAllData();
      this.loadShedStats();
    } else {
      this.router.navigate(['/dashboard']);
    }
    this.loadVideo();
  }

  //Reload section
  reload(section: string) {
    const current = this.router.url;

    let target = '';

    switch (section) {
      case 'applied':
        target = '/dashboard/application/applied';
        break;
      case 'active':
        target = '/dashboard/application/active';
        break;
      case 'archived':
        target = '/dashboard/application/archived';
        break;
      case 'new':
        target = '/dashboard/application/new';
        break;
      case 'measurement':
        target = '/dashboard/measurement/one-month';
        break;
      case 'renew':
        target = '/dashboard/renewal/one-month-renew';
        break;
      case 'normal-handover':
        target = '/dashboard/handover/normal-handover';
        break;
      case 'partial-handover':
        target = '/dashboard/handover/partial-handover';
        break;
      case 'full-handover':
        target = '/dashboard/handover/full-handover';
        break;
      case 'map':
        target = '/dashboard/gis/map';
        break;
    }

    if (current === target) {
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate([target]);
      });
    }
  }

  //All count loaders
  private loadAllData() {
    this.loadApplicationCounts();
    this.loadMeasurementsCount();
    this.loadRenewalsCount();
    this.loadHandoversCount();
    this.loadPartyDetails();
  }

  //Application Count
  private loadApplicationCounts() {
    this.appService.getApplications().subscribe({
      next: (res: any) => {
        const apps = res.data?.applications || [];

        this.appliedCount = apps.length;

        // Separate Resubmit/Denied count (existing)
        this.resubmitDeniedCount = apps.filter((a: any) => {
          const code = (a.verifyYn || '').toUpperCase();
          return code === 'R' || code === 'D';
        }).length;

        this.updateTotalApplications();
      },
      error: (err) => console.error('Error fetching applied apps', err),
    });

    this.appService.getActiveApplications('Y').subscribe({
      next: (res: any) => {
        this.activeCount = res.data?.applications?.length || 0;
        this.updateTotalApplications();
      },
      error: (err) => console.error('Error fetching active apps', err),
    });

    this.appService.getActiveApplications('N').subscribe({
      next: (res: any) => {
        this.archivedCount = res.data?.applications?.length || 0;
        this.updateTotalApplications();
      },
      error: (err) => console.error('Error fetching archived apps', err),
    });
  }

  //Total application count updater
  private updateTotalApplications() {
    this.totalApplications =
      this.appliedCount + this.activeCount + this.archivedCount;
  }

  //Measurement Count
  private loadMeasurementsCount() {
    this.measurementService.getOneMonthMeasurementList().subscribe({
      next: (res: any) => {
        const list = res.data?.measurements || [];
        this.totalMeasurements = list.length;

        this.measurementResubmitDeniedCount = list.filter((m: any) => {
          const code = (m.reqGrantYn || '').toUpperCase();
          return code === 'R' || code === 'D';
        }).length;
      },
      error: (err) => console.error('Error fetching measurements', err),
    });
  }

  //Renewal Count
  private loadRenewalsCount() {
    this.renewalService.getPendingRemeasurements().subscribe({
      next: (res: any) => {
        const list = res.data?.remeasurements || [];
        this.totalRenewals = list.length;

        this.remeasurementResubmitDeniedCount = list.filter((m: any) => {
          const code = (m.reqGrantYn || '').toUpperCase();
          return code === 'R' || code === 'D';
        }).length;
      },
      error: (err) => console.error('Error fetching renewals', err),
    });
  }

  //Handover Count
  private loadHandoversCount() {
    let full = 0;
    let partial = 0;
    let normal = 0;

    this.fullHandoverResubmitDeniedCount = 0;
    this.partialHandoverResubmitDeniedCount = 0;
    this.normalHandoverResubmitDeniedCount = 0;

    this.handoverService.getFullHandoverList().subscribe({
      next: (res: any) => {
        const list = res.data?.pendingHandover || [];
        full = list.length;

        this.fullHandoverResubmitDeniedCount = list.filter((h: any) => {
          const code = (h.reqGrantYn || '').toUpperCase();
          return code === 'R' || code === 'D';
        }).length;

        this.totalHandovers = full + partial + normal;
      },
      error: (err) => console.error('Error fetching full handovers', err),
    });

    this.handoverService.getPartialHandoverList().subscribe({
      next: (res: any) => {
        const list = res.data?.pendingHandover || [];
        partial = list.length;

        this.partialHandoverResubmitDeniedCount = list.filter((h: any) => {
          const code = (h.reqGrantYn || '').toUpperCase();
          return code === 'R' || code === 'D';
        }).length;

        this.totalHandovers = full + partial + normal;
      },
      error: (err) => console.error('Error fetching partial handovers', err),
    });

    this.handoverService.getNormalHandoverList().subscribe({
      next: (res: any) => {
        const list = res.data?.pendingHandover || [];
        normal = list.length;

        this.normalHandoverResubmitDeniedCount = list.filter((h: any) => {
          const code = (h.reqGrantYn || '').toUpperCase();
          return code === 'R' || code === 'D';
        }).length;

        this.totalHandovers = full + partial + normal;
      },
      error: (err) => console.error('Error fetching normal handovers', err),
    });
  }

  //Party Details
  private loadPartyDetails() {
    this.partyService.getPartyPdaDetails().subscribe({
      next: (res: any) => {
        this.partyDetails = res.data?.partyPdaDetails || null;
      },
      error: (err) => console.error('Error fetching party details', err),
    });
  }

  //Shed Stats
  private computeShedStats(shedDetails: any[]) {
    this.totalSheds = shedDetails.length;

    let totalBlocks = 0;
    let occupied = 0;
    let hold = 0;
    let vacant = 0;

    shedDetails.forEach((shed) => {
      if (shed.blocks) {
        totalBlocks += shed.blocks.length;
        shed.blocks.forEach((block: { occupiedFlag: string }) => {
          if (block.occupiedFlag === 'Y') occupied++;
          else if (block.occupiedFlag === 'H') hold++;
          else if (block.occupiedFlag === 'N') vacant++;
        });
      }
    });

    this.totalBlocks = totalBlocks;
    this.occupiedBlocks = occupied;
    this.holdBlocks = hold;
    this.vacantBlocks = vacant;
  }

  //Loading shed data
  private loadShedStats(): void {
    this.http
      .get<any>(`${environment.baseUrl}${environment.getOccupancyDetails}`)
      .subscribe({
        next: (res) => {
          const shedDetails = res.data?.shedDetails || [];
          this.computeShedStats(shedDetails);
        },
        error: (err) => console.error('Error fetching shed stats', err),
      });
  }

  //Child card controls
  closeChildCard(): void {
    this.showChildCard = false;
    this.router.navigate(['/dashboard']);
  }

  // baseVideoUrl = environment.baseUrl + environment.videoApi;

  videoUrl: string | null = null;
  videoError = false;

  showVideo = true;
  isMinimized = false;
  isTheaterMode = false;

  loadVideo() {
    this.videoservice.getVideo().subscribe({
      next: (blob) => {
        this.videoUrl = URL.createObjectURL(blob);
      },
      error: (err) => {
        console.error('Video load error', err);
        this.videoError = true;
      },
    });
  }

  toggleFullscreen(): void {
    this.isTheaterMode = !this.isTheaterMode;
  }

  closeVideo(): void {
    this.isMinimized = true;
    this.showVideo = false;
    this.isTheaterMode = false;
  }

  restoreVideo(): void {
    this.isMinimized = false;
    this.showVideo = true;
  }
}
