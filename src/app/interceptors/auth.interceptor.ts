import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private localHeaderValue =
    'SLGN=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJpWnkxU2ljMzlLeTJmb3FZVnp4NTNnPT0iLCJyb2xlIjoiTnRGQTRRdkk0eERVN2F1UHNUOGRuZz09IiwiZXhwaXJ5IjoiMjAyNi0wMi0xOFQwNzoyMTo1OS42MDhaIiwiaWF0IjoxNzcxMzk3NTE5LCJleHAiOjE3NzEzOTkzMTl9.MF6J3Zu48i1ByqsxzpCDonLdorbHqmTVkBmz6pAdGsc'; // your JWT

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    let modifiedReq = req;

    if (environment.useLocalHeaders) {
      //console.log('Souvik in dev ');
      // LOCAL → add your custom header
      modifiedReq = req.clone({
        setHeaders: {
          souvik: this.localHeaderValue,
        },
      });
    } else {
      //console.log('Souvik in prod ');
      // PROD → enable cookies
      modifiedReq = req.clone({
        withCredentials: true,
      });
    }

    return next.handle(modifiedReq);
  }
}
