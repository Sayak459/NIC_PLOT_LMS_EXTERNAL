import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PartyService {
  private apiUrl = environment.baseUrl + environment.getPartyPdaDetails;

  constructor(private http: HttpClient) {}

  /** 🟩 Fetch PDA Details of the Party */
  getPartyPdaDetails(): Observable<any> {
    return this.http.get<any>(this.apiUrl, {});
  }
}
