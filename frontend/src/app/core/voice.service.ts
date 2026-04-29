import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { environment } from '../../environments/environment';

interface VoiceConfig {
  apiKey: string;
  voiceId: string;
}

@Injectable({ providedIn: 'root' })
export class VoiceService {
  isRecording = signal(false);

  private config: VoiceConfig | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  constructor(private http: HttpClient) {}

  private loadConfig(): Promise<VoiceConfig> {
    if (this.config) return Promise.resolve(this.config);
    return new Promise((resolve, reject) => {
      this.http.get<VoiceConfig>(`${environment.apiUrl}/config/voice-key`).subscribe({
        next: (cfg) => { this.config = cfg; resolve(cfg); },
        error: reject
      });
    });
  }

  async startRecording(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
    this.mediaRecorder = new MediaRecorder(stream, { mimeType });
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.mediaRecorder.start();
    this.isRecording.set(true);
  }

  stopRecording(): Observable<string> {
    return new Observable((observer) => {
      if (!this.mediaRecorder) {
        observer.error('Not recording');
        return;
      }

      this.mediaRecorder.onstop = async () => {
        const mimeType = this.mediaRecorder!.mimeType;
        const blob = new Blob(this.chunks, { type: mimeType });
        this.mediaRecorder!.stream.getTracks().forEach((t) => t.stop());
        this.isRecording.set(false);

        try {
          const cfg = await this.loadConfig();
          const formData = new FormData();
          const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
          formData.append('file', blob, `audio.${ext}`);
          formData.append('model_id', 'scribe_v1');

          const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
            method: 'POST',
            headers: { 'xi-api-key': cfg.apiKey },
            body: formData
          });

          if (!res.ok) throw new Error(`STT error ${res.status}`);
          const data = await res.json();
          observer.next(data.text ?? '');
          observer.complete();
        } catch (err) {
          observer.error(err);
        }
      };

      this.mediaRecorder.stop();
    });
  }


}
