import { Component } from '@angular/core';
import { RestaurantsTableComponent } from '../restaurants-table/restaurants-table.component';

@Component({
  selector: 'app-restaurants-page',
  standalone: true,
  imports: [RestaurantsTableComponent],
  templateUrl: './restaurants-page.component.html',
})
export class RestaurantsPageComponent {}
