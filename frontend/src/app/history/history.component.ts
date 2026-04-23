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
}
