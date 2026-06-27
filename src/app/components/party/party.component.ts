import { Component, OnInit } from '@angular/core';
import { PartyService } from 'src/app/services/party.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-party',
  templateUrl: './party.component.html',
  styleUrls: ['./party.component.scss'],
})
export class PartyComponent implements OnInit {

  loading = true;
  partyDetails: any = null;

  constructor(private partyService: PartyService) {}

  ngOnInit(): void {

    this.partyService.getPartyPdaDetails().subscribe({
      next: (res: any) => {
        if (res.status === 'Success' && res.data?.partyPdaDetails) {
          this.partyDetails = res.data.partyPdaDetails;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching PDA details:', err);
        this.loading = false;
      }
    });
  }
}
