import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-email-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      [attr.class]="className"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>
  `,
})
export class EmailIcon {
  @Input() className: string = 'w-5 h-5';
}
