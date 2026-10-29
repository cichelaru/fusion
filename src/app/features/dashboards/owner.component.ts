import { Component } from '@angular/core';
import { ActivityComponent } from '../shared/activity.component';
import { CostExplorerComponent } from '../shared/cost-explorer.component';
import { KbTableComponent } from '../shared/kb-table.component';

@Component({
  selector: 'app-owner',
  standalone: true,
  imports: [ActivityComponent, CostExplorerComponent, KbTableComponent],
  template: `
  <app-activity title="Dashboard owner de domeniu" />
  <div style="margin-top:20px"><app-cost-explorer /></div>
  <div style="margin-top:20px"><app-kb-table /></div>`
})
export class OwnerComponent {}
