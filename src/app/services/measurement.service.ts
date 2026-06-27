import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MeasurementService {
  private readonly apiBase = environment.baseUrl;

  constructor(private http: HttpClient) {}

  // 🟢 Get Pending Measurements
  getOneMonthMeasurementList(): Observable<any> {
    const url = `${this.apiBase}${environment.getPendingMeasurements}`;
    return this.http.get<any>(url, {});
  }

  // 🔵 Save Measurement
  saveMeasurement(payload: any): Observable<any> {
    const url = `${this.apiBase}${environment.setMeasurementDetails}`;
    return this.http.post<any>(url, payload);
  }
}
