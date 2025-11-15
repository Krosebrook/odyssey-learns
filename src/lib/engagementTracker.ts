import { PerformanceMetrics } from '@/types/adaptive';

interface InteractionEvent {
  timestamp: number;
  type: 'click' | 'input' | 'scroll' | 'pause';
  duration?: number;
}

export class EngagementTracker {
  private startTime: number;
  private interactions: InteractionEvent[] = [];
  private hintCount: number = 0;
  private pauseStart: number | null = null;
  private lastActivity: number;

  constructor() {
    this.startTime = Date.now();
    this.lastActivity = Date.now();
    this.setupListeners();
  }

  private setupListeners() {
    // Track user interactions
    ['click', 'input', 'scroll'].forEach((event) => {
      window.addEventListener(event, () => this.recordInteraction(event as any));
    });

    // Detect pauses (inactivity >10 seconds)
    setInterval(() => {
      const timeSinceActivity = Date.now() - this.lastActivity;
      if (timeSinceActivity > 10000 && !this.pauseStart) {
        this.pauseStart = Date.now();
        this.recordInteraction('pause', timeSinceActivity);
      }
    }, 1000);
  }

  private recordInteraction(type: InteractionEvent['type'], duration?: number) {
    this.interactions.push({ timestamp: Date.now(), type, duration });
    this.lastActivity = Date.now();
    if (this.pauseStart) this.pauseStart = null;
  }

  recordHint() {
    this.hintCount++;
  }

  calculateMetrics(accuracy: number, questionCount: number): PerformanceMetrics {
    const totalTime = Date.now() - this.startTime;
    const speed = totalTime / questionCount / 1000; // seconds per question

    // Calculate engagement score
    const interactionRate = this.interactions.length / (totalTime / 1000 / 60); // interactions per minute
    const pauseCount = this.interactions.filter((i) => i.type === 'pause').length;
    const engagementScore = Math.max(
      0,
      Math.min(10, (interactionRate / 10) * 10 - pauseCount * 0.5)
    );

    // Detect frustration signals
    const frustrationSignals: string[] = [];
    if (pauseCount > 3) frustrationSignals.push('frequent_pauses');
    if (this.hintCount > questionCount / 2) frustrationSignals.push('high_hint_usage');
    if (speed > 120) frustrationSignals.push('taking_too_long');
    if (speed < 10) frustrationSignals.push('rushing');

    // Perceived difficulty (1-10)
    let difficulty_perceived = 5;
    if (accuracy < 0.5) difficulty_perceived += 3;
    if (this.hintCount > questionCount / 3) difficulty_perceived += 2;
    if (pauseCount > 2) difficulty_perceived += 1;
    difficulty_perceived = Math.min(10, difficulty_perceived);

    return {
      accuracy,
      speed,
      hint_usage: this.hintCount,
      retry_count: 0, // TODO: Track retries
      frustration_signals: frustrationSignals,
      engagement_score: engagementScore,
      difficulty_perceived,
    };
  }

  cleanup() {
    ['click', 'input', 'scroll'].forEach((event) => {
      window.removeEventListener(event, () => {});
    });
  }
}
