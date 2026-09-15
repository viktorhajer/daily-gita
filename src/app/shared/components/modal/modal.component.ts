import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: false,
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() text = '';
  @Input() closeLabel = 'Bezárás';
  @Output() close = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.isOpen) {
      this.close.emit();
    }
  }

  onBackdropClick() {
    this.close.emit();
  }

  onModalClick(event: Event) {
    event.stopPropagation();
  }
}


