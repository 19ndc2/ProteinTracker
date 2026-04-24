import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProteinService } from '../core/protein.service';
import { HistoryDay } from '../core/models/protein.models';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent implements OnInit {
  private proteinService = inject(ProteinService);

  days = signal<HistoryDay[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.proteinService.getHistory().subscribe({
      next: (data) => {
        this.days.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  deleteEntry(date: string, entryId: string): void {
    this.proteinService.deleteEntry(date, entryId).subscribe({
      next: (updated) => {
        this.days.update(days =>
          days
            .map(day => day.date === date
              ? { ...day, entries: updated.entries, totalProteinGrams: updated.totalProteinGrams }
              : day)
            .filter(day => day.entries.length > 0)
        );
      },
    });
  }
}
