import { Component, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as QRCode from 'qrcode';
import { buildPublicMenuUrl } from '@app/shared/helpers/public-menu-url';

@Component({
  selector: 'app-qr-code-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-code-modal.component.html',
})
export class QrCodeModal {
  isOpen = input<boolean>(false);
  restaurantName = input<string>('');
  slug = input<string>('');

  close = output<void>();

  dataUrl = signal<string | null>(null);
  url = signal<string>('');

  constructor() {
    effect(() => {
      const slug = this.slug();
      if (!this.isOpen() || !slug) {
        this.dataUrl.set(null);
        return;
      }

      const url = buildPublicMenuUrl(slug);
      this.url.set(url);
      QRCode.toDataURL(url, { width: 320, margin: 2 }).then((dataUrl) => {
        this.dataUrl.set(dataUrl);
      });
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
