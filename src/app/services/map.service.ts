import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Fetch occupancy details for all sheds/blocks
   */
  getOccupancyDetails(): Observable<any> {
    const url = `${this.baseUrl}${environment.getOccupancyDetails}`;
    return this.http.get<any>(url);
  }
}
