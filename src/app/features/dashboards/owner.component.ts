import { Component } from '@angular/core';
import { ActivityComponent } from '../shared/activity.component';
import { CostExplorerComponent } from '../shared/cost-explorer.component';
import { KbTableComponent } from '../shared/kb-table.component';

@Component({
  selector: 'app-owner',
  standalone: true,
  imports: [ActivityComponent, CostExplorerComponent, KbTableComponent],
  templateUrl: './owner.component.html'
})
export class OwnerComponent {}
