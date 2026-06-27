import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';   // ✅ Needed for API calls
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // ✅ Optional but useful

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ApplicationComponent } from './components/application/application.component';
import { AppliedComponent } from './components/application/applied/applied.component';
import { ActiveComponent } from './components/application/active/active.component';
import { ArchivedComponent } from './components/application/archived/archived.component';
import { NewComponent } from './components/application/new/new.component';
import { OneMonthFormComponent } from './components/application/new/one-month-form/one-month-form.component';
import { ElevenMonthFormComponent } from './components/application/new/eleven-month-form/eleven-month-form.component';
import { MeasurementComponent } from './components/measurement/measurement.component';
import { OneMonthComponent } from './components/measurement/one-month/one-month.component';
import { RenewalComponent } from './components/renewal/renewal.component';
import { OneMonthRenewComponent } from './components/renewal/one-month-renew/one-month-renew.component';
import { HandoverComponent } from './components/handover/handover.component';
import { NormalHandoverComponent } from './components/handover/normal-handover/normal-handover.component';
import { PartialHandoverComponent } from './components/handover/partial-handover/partial-handover.component';
import { FullHandoverComponent } from './components/handover/full-handover/full-handover.component';
import { PartyComponent } from './components/party/party.component';
import { MapComponent } from './components/gis/map/map.component';
import { GisComponent } from './components/gis/gis.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { UpdateComponent } from './components/application/applied/update/update.component';
import { MeasureUpdateComponent } from './components/measurement/one-month/measure-update/measure-update.component';
import { RenewUpdateComponent } from './components/renewal/one-month-renew/renew-update/renew-update.component';
import { FullUpdateComponent } from './components/handover/full-handover/full-update/full-update.component';
import { PartialUpdateComponent } from './components/handover/partial-handover/partial-update/partial-update.component';
import { NormalUpdateComponent } from './components/handover/normal-handover/normal-update/normal-update.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { NoCopyPasteDirective } from './shared/directives/no-copy-paste.directive';
import { VcnInputDirective } from './shared/directives/vcn-input.directive';
import { AreaInputDirective } from './shared/directives/whole-number-area.directive';
import { RemarksInputDirective } from './shared/directives/remarks-input.directive';
import { NoTypeDateDirective } from './shared/directives/no-typography-date.directive';
import { NoPastDateDirective } from './shared/directives/no-past-date.directive';
import { FileSizeDirective } from './shared/directives/file-size.directive';
import { DefaultComponent } from './components/dashboard/default/default.component';
import { ReportComponent } from './components/report/report.component';


@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    ApplicationComponent,
    AppliedComponent,
    ActiveComponent,
    ArchivedComponent,
    NewComponent,
    OneMonthFormComponent,
    ElevenMonthFormComponent,
    MeasurementComponent,
    OneMonthComponent,
    RenewalComponent,
    OneMonthRenewComponent,
    HandoverComponent,
    NormalHandoverComponent,
    PartialHandoverComponent,
    FullHandoverComponent,
    PartyComponent,
    MapComponent,
    GisComponent,
    UpdateComponent,
    MeasureUpdateComponent,
    RenewUpdateComponent,
    FullUpdateComponent,
    PartialUpdateComponent,
    NormalUpdateComponent,
    NoCopyPasteDirective,
    VcnInputDirective,
    AreaInputDirective,
    RemarksInputDirective,
    NoTypeDateDirective,
    NoPastDateDirective,
    FileSizeDirective,
    DefaultComponent,
    ReportComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,        // ✅ Enables HTTP requests
    FormsModule,             // ✅ Template-driven forms
    ReactiveFormsModule      // ✅ Reactive forms (for advanced usage)
  ],
  exports: [
    NoCopyPasteDirective,
    VcnInputDirective,
    AreaInputDirective,
    RemarksInputDirective,
    NoTypeDateDirective,
    NoPastDateDirective,
    FileSizeDirective
  ],
  providers: [  {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    } ],
    bootstrap: [AppComponent]
})
export class AppModule { }
