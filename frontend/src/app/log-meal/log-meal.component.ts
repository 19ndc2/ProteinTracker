import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProteinService } from '../core/protein.service';
import { VoiceService } from '../core/voice.service';
import { ConfirmResponse, ProteinEstimate } from '../core/models/protein.models';

type State = 'idle' | 'parsing' | 'preview' | 'confirming' | 'done';

@Component({
  selector: 'app-log-meal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './log-meal.component.html',
  styleUrl: './log-meal.component.scss'
})
export class LogMealComponent {
  @Output() mealConfirmed = new EventEmitter<ConfirmResponse>();

  transcript = signal('');
  state = signal<State>('idle');
  preview = signal<ProteinEstimate | null>(null);
  errorMsg = signal('');

  // Use local date, not UTC — toISOString() returns the UTC date which is wrong for users in US timezones at night
  private localDateString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  readonly today = this.localDateString();

  constructor(
    private proteinService: ProteinService,
    public voice: VoiceService
  ) {}

  parse(): void {
    const text = this.transcript().trim();
    if (!text || this.state() !== 'idle') return;
    this.state.set('parsing');
    this.errorMsg.set('');

    this.proteinService.parse(text, this.today).subscribe({
      next: (estimate) => {
        this.preview.set(estimate);
        this.state.set('preview');
        this.voice.speak(estimate.confirmationText).catch(() => {});
      },
      error: () => {
        this.errorMsg.set('Could not estimate protein. Please try again.');
        this.state.set('idle');
      }
    });
  }

  confirm(): void {
    const p = this.preview();
    if (!p || this.state() !== 'preview') return;
    this.state.set('confirming');

    this.proteinService.confirm(p.foodDescription, p.proteinGrams, p.date ?? this.today).subscribe({
      next: (res) => {
        this.mealConfirmed.emit(res);
        this.voice.speak(res.acknowledgementText).catch(() => {});
        this.state.set('done');
        setTimeout(() => this.reset(), 2500);
      },
      error: () => {
        this.errorMsg.set('Failed to save. Please try again.');
        this.state.set('preview');
      }
    });
  }

  toggleRecording(): void {
    if (this.voice.isRecording()) {
      this.voice.stopRecording().subscribe({
        next: (text) => {
          if (text.trim()) {
            this.transcript.set(text);
            this.parse();
          }
        },
        error: () => this.errorMsg.set('Recording failed. Please try again.')
      });
    } else {
      this.voice.startRecording().catch(() =>
        this.errorMsg.set('Microphone access denied.')
      );
    }
  }

  retry(): void {
    this.preview.set(null);
    this.errorMsg.set('');
    this.state.set('idle');
  }

  private reset(): void {
    this.transcript.set('');
    this.preview.set(null);
    this.errorMsg.set('');
    this.state.set('idle');
  }
}
