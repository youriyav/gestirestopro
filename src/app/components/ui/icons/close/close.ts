import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-close-icon',
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
        d="M6 18L18 6M6 6l12 12"/>
    </svg>
  `,
})
export class CloseIcon {
  @Input() className: string = 'w-5 h-5';
}
