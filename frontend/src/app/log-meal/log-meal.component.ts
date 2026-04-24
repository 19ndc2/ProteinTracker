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
  dateInput = signal('');
  state = signal<State>('idle');
  preview = signal<ProteinEstimate | null>(null);
  errorMsg = signal('');

  constructor(
    private proteinService: ProteinService,
    public voice: VoiceService
  ) {}

  parse(): void {
    const text = this.transcript().trim();
    if (!text || this.state() !== 'idle') return;
    this.state.set('parsing');
    this.errorMsg.set('');

    this.proteinService.parse(text).subscribe({
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

    const date = this.resolveDate();
    this.proteinService.confirm(p.foodDescription, p.proteinGrams, date ?? undefined).subscribe({
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

  /** Returns an ISO date string for the given input, or null meaning "today". */
  private resolveDate(): string | null {
    const raw = this.dateInput().trim().toLowerCase();
    if (!raw || raw === 'today') return null;
    if (raw === 'yesterday') return this.daysAgo(1);
    const m = raw.match(/^(\d+)\s+days?\s+ago$/);
    if (m) return this.daysAgo(parseInt(m[1], 10));
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    // Try parsing as a locale date (e.g. "01/15/2024") and fall back to today
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return null;
  }

  private daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  private reset(): void {
    this.transcript.set('');
    this.dateInput.set('');
    this.preview.set(null);
    this.errorMsg.set('');
    this.state.set('idle');
  }
}
