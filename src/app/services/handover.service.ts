import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HandoverService {
  // 🟩 Base URL for Full Handover API
  private apiUrl = environment.baseUrl + environment.getPending1MFullHandover;

  // 🟦 (Optional) You can also define others for Normal/Partial if needed
  private normalUrl =
    environment.baseUrl + environment.getPendingNormalHandover;
  private partialUrl =
    environment.baseUrl + environment.getPending1MPartialHandover;

  constructor(private http: HttpClient) {}

  // 🟩 Fetch Full Handover List
  getFullHandoverList(): Observable<any> {
    return this.http.get<any>(this.apiUrl, {});
  }

  getNormalHandoverList(): Observable<any> {
    return this.http.get<any>(this.normalUrl, {});
  }

  // 🟡 PARTIAL HANDOVER
  getPartialHandoverList(): Observable<any> {
    return this.http.get<any>(this.partialUrl, {});
  }

  // 🟨 Save Full Handover Request
  saveFullHandover(payload: any): Observable<any> {
    return this.http.post<any>(
      environment.baseUrl + environment.setFullHandoverDetails,
      payload,
    );
  }

  //Resubmit Full Handover Request
  resubmitFullHandover(payload: any): Observable<any> {
    return this.http.post<any>(
      environment.baseUrl + environment.resubmitFullHandover,
      payload,
    );
  }

  //save Partial handover
  savePartialHandover(payload: any): Observable<any> {
    return this.http.post<any>(
      environment.baseUrl + environment.setPartialHandoverDetails,
      payload,
    );
  }

  //save Normal Handover
  saveNormalHandover(payload: any): Observable<any> {
    return this.http.post<any>(
      environment.baseUrl + environment.setNormalHandoverDetails,
      payload,
    );
  }

  // 🟧 Upload Full Handover Document
  uploadDocument(formData: FormData): Observable<any> {
    return this.http.post<any>(
      environment.baseUrl + 'uploadFullHandoverDocument',
      formData,
    );
  }
}
