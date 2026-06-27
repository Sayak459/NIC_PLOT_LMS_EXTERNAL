import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private baseUrl = environment.baseUrl + environment.generateReport;

  constructor(private http: HttpClient) {}

  generateReport(appCd: string, payload: any): Observable<HttpResponse<Blob>> {
    return this.http.post(
      `${this.baseUrl}/${appCd}`, // ✅ CRITICAL FIX
      payload,
      {
        observe: 'response',
        responseType: 'blob',
      },
    );
  }
}
