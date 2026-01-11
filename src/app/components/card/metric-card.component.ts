import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metric-card',
  imports: [CommonModule],
  templateUrl: './metric-card.component.html',
  styleUrl: './metric-card.component.css',
})
export class MetricCardComponent {
  // Signal-based inputs using the new input() function
  label = input<string>('');
  metricValue = input<number | string>(0);
  trackingValue = input<number | string | undefined>(undefined);
  isIncreased = input<boolean>(true);
  isPrimary = input<boolean>(false);
  showTracking = input<boolean>(true);

  // Computed signals for dynamic classes
  cardBackgroundClass = computed(() =>
    this.isPrimary()
      ? 'bg-primary-50 text-white'
      : 'bg-white text-gray-900'
  );

  titleClass = computed(() =>
    this.isPrimary()
      ? 'text-lg font-medium opacity-90'
      : 'text-lg font-medium text-gray-700'
  );

  buttonClass = computed(() =>
    this.isPrimary()
      ? 'bg-white/10 hover:bg-white/20'
      : 'bg-gray-100 hover:bg-gray-200'
  );

  iconColor = computed(() =>
    this.isPrimary() ? '' : 'text-gray-600'
  );

  valueClass = computed(() =>
    this.isPrimary()
      ? 'text-6xl font-bold mb-3'
      : 'text-6xl font-bold text-gray-900 mb-3'
  );

  trackingTextClass = computed(() =>
    this.isPrimary()
      ? 'text-sm opacity-90'
      : 'text-sm text-gray-600'
  );

  trackingBadgeClass = computed(() => {
    if (this.isPrimary()) {
      return 'bg-primary-100 px-2 py-1 rounded flex items-center gap-1';
    }
    return this.isIncreased()
      ? 'bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1'
      : 'bg-red-100 text-red-700 px-2 py-1 rounded flex items-center gap-1';
  });

  trackingText = computed(() =>
    this.isIncreased()
      ? 'Increased from last month'
      : 'Decreased from last month'
  );
}
