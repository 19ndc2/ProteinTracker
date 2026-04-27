import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ConfirmResponse,
  DailyLogResponse,
  HistoryDay,
  MonthlyStats,
  ProteinEstimate
} from './models/protein.models';

@Injectable({ providedIn: 'root' })
export class ProteinService {
  private readonly base = `${environment.apiUrl}/protein`;

  constructor(private http: HttpClient) {}

  getToday(): Observable<DailyLogResponse> {
    return this.http.get<DailyLogResponse>(`${this.base}/today`);
  }

  getHistory(): Observable<HistoryDay[]> {
    return this.http.get<HistoryDay[]>(`${this.base}/history`);
  }

  parse(transcript: string, localDate: string): Observable<ProteinEstimate> {
    return this.http.post<ProteinEstimate>(`${this.base}/parse`, { transcript, localDate });
  }

  confirm(foodDescription: string, proteinGrams: number, date?: string): Observable<ConfirmResponse> {
    return this.http.post<ConfirmResponse>(`${this.base}/confirm`, { foodDescription, proteinGrams, date });
  }

  deleteEntry(date: string, entryId: string): Observable<DailyLogResponse> {
    return this.http.delete<DailyLogResponse>(`${this.base}/entry/${date}/${entryId}`);
  }

  getMonthlyStats(): Observable<MonthlyStats> {
    return this.http.get<MonthlyStats>(`${this.base}/stats/monthly`);
  }
}
