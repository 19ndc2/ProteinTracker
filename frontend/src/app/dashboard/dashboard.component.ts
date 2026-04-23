import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ProteinService } from '../core/protein.service';
import { LogMealComponent } from '../log-meal/log-meal.component';
import { ConfirmResponse, FoodEntry } from '../core/models/protein.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LogMealComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private proteinService = inject(ProteinService);

  totalGrams = signal(0);
  dailyGoal = signal(150);
  entries = signal<FoodEntry[]>([]);
  loading = signal(true);

  progress = computed(() =>
    Math.min(100, Math.round((this.totalGrams() / this.dailyGoal()) * 100)));

  // SVG ring: circumference of circle with r=40 → 2π×40 ≈ 251.3
  dashOffset = computed(() => 251.3 * (1 - this.progress() / 100));

  ngOnInit(): void {
    this.loadToday();
  }

  onMealConfirmed(res: ConfirmResponse): void {
    this.totalGrams.set(res.totalProteinGramsToday);
    this.loadToday();
  }

  private loadToday(): void {
    this.proteinService.getToday().subscribe({
      next: (data) => {
        this.totalGrams.set(data.totalProteinGrams);
        this.entries.set(data.entries);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
