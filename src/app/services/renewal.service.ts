import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RenewalService {
  private readonly apiBase = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /** 🟢 Fetch pending renewal remeasurements */
  getPendingRemeasurements(): Observable<any> {
    const url = `${this.apiBase}${environment.getPendingRemeasurements}`;

    return this.http.get<any>(url, {});
  }

  /** 🟡 Save new remeasurement request */
  saveRemeasurement(payload: any): Observable<any> {
    const url = `${this.apiBase}${environment.setRemeasurementDetails}`;
    return this.http.post<any>(url, payload);
  }
}
