import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  private apiUrl = environment.baseUrl + environment.getAppliedApplications;
  private activeApiUrl = environment.baseUrl + environment.getActiveInactiveApplications;

  constructor(private http: HttpClient) {}

  // 🟩 Fetch Applied Applications
  getApplications(): Observable<any> {
    return this.http.get<any>(this.apiUrl, {});
  }

  // 🟦 Fetch Active/Inactive Applications
  getActiveApplications(activeYn: 'Y' | 'N' = 'Y'): Observable<any> {
    return this.http.post<any>(this.activeApiUrl, { activeYn });
  }

  // 🟥 Save One Land Licence
  setOneLandLicence(payload: any): Observable<any> {
    const url = environment.baseUrl + environment.setOneLandLicence;
    return this.http.post<any>(url, payload);
  }
}
