import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VideoService {
  private videoUrl = environment.vidUrl + environment.videoApi;

  constructor(private http: HttpClient) {}

  getVideo(): Observable<Blob> {
    const headers = new HttpHeaders({
      video: 'LMS',
    });
    return this.http.get(this.videoUrl, {
      headers,
      responseType: 'blob',
    });
  }
}
