import { Injectable, signal } from '@angular/core';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  notifications = signal<ToastNotification[]>([]);

  show(type: ToastNotification['type'], message: string): void {
    const id = Math.random().toString(36).substring(2, 9);
    const notification: ToastNotification = { id, type, message };

    this.notifications.update(notifications => [...notifications, notification]);

    setTimeout(() => {
      this.remove(id);
    }, 5000);
  }

  remove(id: string): void {
    this.notifications.update(notifications =>
      notifications.filter(n => n.id !== id)
    );
  }

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  warning(message: string): void {
    this.show('warning', message);
  }
}
