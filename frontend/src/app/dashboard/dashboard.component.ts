import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ProteinService } from '../core/protein.service';
import { LogMealComponent } from '../log-meal/log-meal.component';
import { ConfirmResponse, FoodEntry } from '../core/models/protein.models';
import { localDateString } from '../core/date.util';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LogMealComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private proteinService = inject(ProteinService);

  totalGrams = signal(0);
  entries = signal<FoodEntry[]>([]);
  loading = signal(true);

  goalEditing = signal(false);
  goalDraft = signal('');

  dailyGoal = computed(() => this.auth.currentUser()?.dailyGoalGrams ?? 150);

  progress = computed(() =>
    Math.min(100, Math.round((this.totalGrams() / this.dailyGoal()) * 100)));

  // SVG ring: circumference of circle with r=40 → 2π×40 ≈ 251.3
  dashOffset = computed(() => 251.3 * (1 - this.progress() / 100));

  ngOnInit(): void {
    this.loadToday();
  }

  onMealConfirmed(res: ConfirmResponse): void {
    const today = localDateString();
    if (res.date === today) {
      this.totalGrams.set(res.totalProteinGrams);
    }
    this.loadToday();
  }

  deleteEntry(entryId: string): void {
    const today = localDateString();
    this.proteinService.deleteEntry(today, entryId).subscribe({
      next: (data) => {
        this.entries.set(data.entries);
        this.totalGrams.set(data.totalProteinGrams);
      },
    });
  }

  startEditGoal(): void {
    this.goalDraft.set(String(this.dailyGoal()));
    this.goalEditing.set(true);
  }

  saveGoal(): void {
    const val = parseInt(this.goalDraft(), 10);
    if (isNaN(val) || val < 1 || val > 500) return;
    this.auth.updateGoal(val).subscribe();
    this.goalEditing.set(false);
  }

  cancelEditGoal(): void {
    this.goalEditing.set(false);
  }

  private loadToday(): void {
    this.proteinService.getToday(localDateString()).subscribe({
      next: (data) => {
        this.totalGrams.set(data.totalProteinGrams);
        this.entries.set(data.entries);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
