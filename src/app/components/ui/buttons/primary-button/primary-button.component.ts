import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-primary-button',
  imports: [],
  templateUrl: './primary-button.component.html',
  styleUrl: './primary-button.component.css',
})
export class PrimaryButton {
  label = input.required<string>();
  type = input<'button' | 'submit'>('button');
  disabled = input<boolean>(false);
  fullWidth = input<boolean>(false);
  onClick = output<MouseEvent>();

  handleClick(event: MouseEvent) {
    if (this.disabled()) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
    this.onClick.emit(event);
  }
}
