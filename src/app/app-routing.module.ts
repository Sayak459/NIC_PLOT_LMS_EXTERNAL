import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// 🧭 Core Components
import { DashboardComponent } from './components/dashboard/dashboard.component';

// 🟩 Application
import { AppliedComponent } from './components/application/applied/applied.component';
import { ActiveComponent } from './components/application/active/active.component';
import { ArchivedComponent } from './components/application/archived/archived.component';
import { OneMonthFormComponent } from './components/application/new/one-month-form/one-month-form.component';
import { ElevenMonthFormComponent } from './components/application/new/eleven-month-form/eleven-month-form.component';

// 🟦 Measurement
import { OneMonthComponent } from './components/measurement/one-month/one-month.component';
import { OneMonthRenewComponent } from './components/renewal/one-month-renew/one-month-renew.component';
import { NormalHandoverComponent } from './components/handover/normal-handover/normal-handover.component';
import { PartialHandoverComponent } from './components/handover/partial-handover/partial-handover.component';
import { FullHandoverComponent } from './components/handover/full-handover/full-handover.component';
import { MapComponent } from './components/gis/map/map.component';
import { NewComponent } from './components/application/new/new.component';
import { UpdateComponent } from './components/application/applied/update/update.component';
import { MeasureUpdateComponent } from './components/measurement/one-month/measure-update/measure-update.component';
import { RenewUpdateComponent } from './components/renewal/one-month-renew/renew-update/renew-update.component';
import { FullUpdateComponent } from './components/handover/full-handover/full-update/full-update.component';
import { NormalUpdateComponent } from './components/handover/normal-handover/normal-update/normal-update.component';
import { PartialUpdateComponent } from './components/handover/partial-handover/partial-update/partial-update.component';
import { HandoverComponent } from './components/handover/handover.component';
import { ReportComponent } from './components/report/report.component';

const routes: Routes = [
  // ✅ Default
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  // Dashboard layout
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      { path: 'application/applied', component: AppliedComponent },
      { path: 'application/active', component: ActiveComponent },
      { path: 'application/archived', component: ArchivedComponent },
      {
        path: 'application/new',
        component: NewComponent,
        children: [
          { path: '', redirectTo: 'one-month', pathMatch: 'full' },
          { path: 'one-month', component: OneMonthFormComponent },
          { path: 'eleven-month', component: ElevenMonthFormComponent },
        ],
      },
      { path: 'measurement/one-month', component: OneMonthComponent },
      { path: 'renewal/one-month-renew', component: OneMonthRenewComponent },
      { path: 'handover/normal-handover', component: NormalHandoverComponent },
      {
        path: 'handover/partial-handover',
        component: PartialHandoverComponent,
      },
      { path: 'handover/full-handover', component: FullHandoverComponent },
      { path: 'gis/map', component: MapComponent },
      {
        path: 'application/applied/update-form/:appNo',
        component: UpdateComponent,
      },
      {
        path: 'measurement/one-month/update/:appNo',
        component: MeasureUpdateComponent,
      },
      {
        path: 'renewal/one-month-renew/update/:appNo',
        component: RenewUpdateComponent,
      },
      {
        path: 'handover/normal-handover/update/:appNo',
        component: NormalUpdateComponent,
      },
      {
        path: 'handover/partial-handover/update/:appNo',
        component: PartialUpdateComponent,
      },
      {
        path: 'handover/full-handover/update/:appNo',
        component: FullUpdateComponent,
      },
    ],
  },

  // Standalone routes (can be accessed directly)
  { path: 'application/applied', component: AppliedComponent },
  { path: 'application/active', component: ActiveComponent },
  { path: 'application/archived', component: ArchivedComponent },
  {
    path: 'application/new',
    component: NewComponent,
    children: [
      { path: '', redirectTo: 'one-month', pathMatch: 'full' },
      { path: 'one-month', component: OneMonthFormComponent },
      { path: 'eleven-month', component: ElevenMonthFormComponent },
    ],
  },
  { path: 'measurement/one-month', component: OneMonthComponent },
  { path: 'renewal/one-month-renew', component: OneMonthRenewComponent },
  {
    path: 'renewal/one-month-renew/update/:appNo',
    component: RenewUpdateComponent,
  },
  {
    path: 'handover',
    component: HandoverComponent,
    children: [
      { path: '', redirectTo: 'normal-handover', pathMatch: 'full' },
      { path: 'full-handover', component: FullHandoverComponent },
      { path: 'partial-handover', component: PartialHandoverComponent },
      { path: 'normal-handover', component: NormalHandoverComponent },
    ],
  },
  { path: 'gis/map', component: MapComponent },
  {
    path: 'application/applied/update-form/:appNo',
    component: UpdateComponent,
  },
  {
    path: 'measurement/one-month/update/:appNo',
    component: MeasureUpdateComponent,
  },
  {
    path: 'handover/normal-handover/update/:appNo',
    component: NormalUpdateComponent,
  },
  {
    path: 'handover/partial-handover/update/:appNo',
    component: PartialUpdateComponent,
  },
  {
    path: 'handover/full-handover/update/:appNo',
    component: FullUpdateComponent,
  },
  {
    path: 'reports/:appCd',
    component: ReportComponent,
  },
  //internal module will be loaded here
  // ✅ CONNECT INTERNAL MODULE HERE

  // Wildcard
  { path: '**', redirectTo: '/dashboard' },
];

@NgModule({
  // imports: [RouterModule.forRoot(routes)],

  imports: [RouterModule.forRoot(routes, { useHash: true })],

  exports: [RouterModule],
})
export class AppRoutingModule {}
