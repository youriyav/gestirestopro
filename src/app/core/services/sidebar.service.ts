import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  // Signal pour gérer l'état collapsed de la sidebar
  private _isCollapsed = signal(false);

  // Signal pour gérer l'état open/close de la sidebar (mobile)
  private _isOpen = signal(false);

  /**
   * Retourne l'état collapsed de la sidebar
   */
  get isCollapsed() {
    return this._isCollapsed.asReadonly();
  }

  /**
   * Retourne l'état open de la sidebar (pour mobile)
   */
  get isOpen() {
    return this._isOpen.asReadonly();
  }

  /**
   * Toggle l'état collapsed de la sidebar
   */
  toggle(): void {
    this._isCollapsed.set(!this._isCollapsed());
  }

  /**
   * Définir l'état collapsed de la sidebar
   */
  setCollapsed(collapsed: boolean): void {
    this._isCollapsed.set(collapsed);
  }

  /**
   * Collapse la sidebar
   */
  collapse(): void {
    this._isCollapsed.set(true);
  }

  /**
   * Expand la sidebar
   */
  expand(): void {
    this._isCollapsed.set(false);
  }

  /**
   * Toggle l'état open de la sidebar (mobile)
   */
  toggleOpen(): void {
    this._isOpen.set(!this._isOpen());
  }

  /**
   * Ouvrir la sidebar (mobile)
   */
  open(): void {
    this._isOpen.set(true);
  }

  /**
   * Fermer la sidebar (mobile)
   */
  close(): void {
    this._isOpen.set(false);
  }
}
