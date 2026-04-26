import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ProteinService } from '../core/protein.service';
import { AuthService } from '../core/auth.service';
import { MonthlyStats } from '../core/models/protein.models';

interface ChartPoint {
  x: number;
  y: number;
  date: string;
  proteinGrams: number;
}

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss'
})
export class StatsComponent implements OnInit {
  private proteinService = inject(ProteinService);
  protected auth = inject(AuthService);

  stats = signal<MonthlyStats | null>(null);
  loading = signal(true);
  error = signal(false);
  hoveredPoint = signal<ChartPoint | null>(null);

  // SVG canvas dimensions
  private readonly CW = 600;
  private readonly CH = 200;
  private readonly PL = 45;   // left pad for y-axis labels
  private readonly PR = 15;
  private readonly PT = 15;
  private readonly PB = 35;   // bottom pad for x-axis labels
  private readonly PW = this.CW - this.PL - this.PR;
  private readonly PH = this.CH - this.PT - this.PB;

  protected readonly chartW = this.CW;
  protected readonly chartH = this.CH;
  protected readonly plotTop = this.PT;
  protected readonly plotBottom = this.PT + this.PH;
  protected readonly plotLeft = this.PL;

  protected yMax = computed(() => {
    const goal = this.auth.currentUser()?.dailyGoalGrams ?? 150;
    const s = this.stats();
    if (!s || s.days.length === 0) return Math.max(goal, 100);
    const maxProtein = Math.max(...s.days.map(d => d.proteinGrams));
    // 15% headroom, rounded up to nearest 10
    return Math.ceil(Math.max(goal, maxProtein) * 1.15 / 10) * 10;
  });

  protected goalY = computed(() => {
    const goal = this.auth.currentUser()?.dailyGoalGrams ?? 150;
    return this.PT + (1 - goal / this.yMax()) * this.PH;
  });

  protected goalGrams = computed(() => this.auth.currentUser()?.dailyGoalGrams ?? 150);

  protected gridLines = computed(() => {
    const yMax = this.yMax();
    const step = Math.ceil(yMax / 4 / 10) * 10;
    const lines: { y: number; label: string }[] = [];
    for (let g = step; g <= yMax; g += step) {
      const y = this.PT + (1 - g / yMax) * this.PH;
      lines.push({ y, label: `${g}` });
    }
    return lines;
  });

  protected chartPoints = computed((): ChartPoint[] => {
    const s = this.stats();
    if (!s || s.days.length === 0) return [];
    const yMax = this.yMax();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return s.days.map(day => {
      const d = new Date(day.date + 'T00:00:00');
      const daysAgo = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      const dayIndex = 29 - daysAgo;
      const x = this.PL + (dayIndex / 29) * this.PW;
      const y = this.PT + (1 - day.proteinGrams / yMax) * this.PH;
      return { x, y, date: day.date, proteinGrams: day.proteinGrams };
    });
  });

  protected polyline = computed(() => {
    const pts = this.chartPoints();
    if (pts.length < 2) return '';
    return pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  });

  protected xAxisTicks = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [29, 20, 10, 0].map(daysAgo => {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      const dayIndex = 29 - daysAgo;
      const x = this.PL + (dayIndex / 29) * this.PW;
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { x, label };
    });
  });

  ngOnInit() {
    this.proteinService.getMonthlyStats().subscribe({
      next: s => { this.stats.set(s); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); }
    });
  }

  protected hoverPoint(pt: ChartPoint) { this.hoveredPoint.set(pt); }
  protected clearHover() { this.hoveredPoint.set(null); }
}
