/**
 * REPSCAN MoodMap Engine
 *
 * Analyzes the emotional journey of a video from start to end.
 * Splits video into 10-second segments, derives sentiment & emotion per segment,
 * fuses available modalities, and produces a MoodMap report with:
 *   - Overall score (-1.0 to +1.0)
 *   - Overall sentiment label
 *   - Top emotions distribution
 *   - Key moments (positive peaks, negative dips)
 *   - Reputation risk alerts
 *
 * Modality fusion weights:
 *   Audio+Transcript: 0.6 (highest)
 *   Visual emotion:   0.25 (medium)
 *   Captions/Subtitles: 0.15 (lower)
 *
 * When a modality is unavailable, its weight is redistributed proportionally.
 */

import type { SentimentLabel } from "@/lib/sentiment";
import { fallbackSentiment } from "@/lib/sentiment";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EmotionLabel =
  | "anger"
  | "joy"
  | "sadness"
  | "fear"
  | "disgust"
  | "surprise"
  | "neutral";

export type RiskAlertType =
  | "Negative Surge"
  | "Possible Reputation Attack"
  | "Emotional Volatility"
  | "Sustained Negativity";

export type ModalityKind = "transcript" | "visual" | "captions";

export interface SegmentAnalysis {
  /** Segment index (0-based) */
  index: number;
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
  /** Time range label, e.g. "0:00–0:10" */
  timeLabel: string;
  /** Sentiment: Positive / Neutral / Negative */
  sentiment: SentimentLabel;
  /** Emotion label */
  emotion: EmotionLabel;
  /** Sentiment score: -1.0 to 1.0 */
  score: number;
  /** Source text snippet used for analysis */
  snippet: string;
}

export interface KeyMoment {
  /** Segment time label */
  timeLabel: string;
  /** Type: peak or dip */
  type: "peak" | "dip";
  /** Score at this moment */
  score: number;
  /** Emotion at this moment */
  emotion: EmotionLabel;
  /** Brief explanation */
  description: string;
}

export interface RiskAlert {
  /** Alert type */
  type: RiskAlertType;
  /** Severity: high / medium / low */
  severity: "high" | "medium" | "low";
  /** Description */
  description: string;
}

export interface ModalityStatus {
  kind: ModalityKind;
  available: boolean;
  weight: number;
  note: string;
}

export interface EmotionDistribution {
  emotion: EmotionLabel;
  percentage: number;
  count: number;
}

export interface MoodMapReport {
  /** Video URL or ID */
  videoUrl: string;
  /** Video title (if available) */
  videoTitle: string;
  /** Optional keyword context */
  keywordContext: string;
  /** Modality status */
  modalities: ModalityStatus[];
  /** Total video duration in seconds */
  durationSeconds: number;
  /** Segment size in seconds */
  segmentSize: number;
  /** Per-segment analysis */
  segments: SegmentAnalysis[];
  /** Overall score: -1.0 to 1.0 */
  overallScore: number;
  /** Overall sentiment label */
  overallSentiment: SentimentLabel;
  /** Top emotions distribution */
  emotionDistribution: EmotionDistribution[];
  /** Key moments: biggest peaks and dips */
  keyMoments: KeyMoment[];
  /** Reputation risk alerts (may be empty) */
  riskAlerts: RiskAlert[];
  /** Confidence level */
  confidence: "high" | "medium" | "low";
  /** Generated at ISO timestamp */
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default segment size in seconds */
const DEFAULT_SEGMENT_SIZE = 10;

/** Modality base weights (sum = 1.0) */
const BASE_WEIGHTS: Record<ModalityKind, number> = {
  transcript: 0.6,
  visual: 0.25,
  captions: 0.15,
};

// ---------------------------------------------------------------------------
// Emotion detection (text-based)
// ---------------------------------------------------------------------------

const EMOTION_KEYWORDS: Record<EmotionLabel, string[]> = {
  anger: [
    "angry", "furious", "rage", "hate", "outrage", "mad", "annoyed",
    "frustrated", "disgusted", "pissed", "hostile", "irritated", "infuriated",
  ],
  joy: [
    "happy", "love", "amazing", "wonderful", "great", "awesome", "fantastic",
    "beautiful", "excellent", "delightful", "brilliant", "superb", "enjoy",
    "excited", "thrilled", "blessed", "grateful", "celebrate",
  ],
  sadness: [
    "sad", "cry", "crying", "depressed", "heartbroken", "grief", "loss",
    "mourning", "tragic", "devastating", "painful", "miss", "lonely",
    "disappointed", "sorrow", "unhappy",
  ],
  fear: [
    "afraid", "scared", "terrified", "fear", "anxious", "panic", "horror",
    "dread", "nightmare", "worried", "nervous", "alarming", "threatening",
  ],
  disgust: [
    "disgusting", "gross", "revolting", "nauseating", "repulsive", "vile",
    "sickening", "appalling", "cringe", "toxic", "pathetic",
  ],
  surprise: [
    "surprise", "surprised", "shocking", "unexpected", "wow", "unbelievable",
    "incredible", "astonishing", "stunning", "mindblowing", "omg",
  ],
  neutral: [],
};

/**
 * Detect the dominant emotion from text using keyword matching.
 */
export function detectEmotion(text: string): EmotionLabel {
  const lower = text.toLowerCase();
  const words = lower.split(/\W+/);

  const scores: Record<EmotionLabel, number> = {
    anger: 0,
    joy: 0,
    sadness: 0,
    fear: 0,
    disgust: 0,
    surprise: 0,
    neutral: 0,
  };

  for (const word of words) {
    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
      if (keywords.includes(word)) {
        scores[emotion as EmotionLabel]++;
      }
    }
  }

  // Find highest scoring emotion
  let best: EmotionLabel = "neutral";
  let bestScore = 0;
  for (const [emotion, score] of Object.entries(scores)) {
    if (emotion !== "neutral" && score > bestScore) {
      best = emotion as EmotionLabel;
      bestScore = score;
    }
  }

  return best;
}

/**
 * Convert a sentiment label to a numeric score.
 */
export function sentimentToScore(sentiment: SentimentLabel): number {
  switch (sentiment) {
    case "positive":
      return 0.7;
    case "negative":
      return -0.7;
    case "neutral":
      return 0.0;
  }
}

// ---------------------------------------------------------------------------
// Time formatting
// ---------------------------------------------------------------------------

/**
 * Format seconds to MM:SS label.
 */
export function formatTimeLabel(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Segment-level analysis
// ---------------------------------------------------------------------------

export interface TranscriptSegment {
  startTime: number;
  endTime: number;
  text: string;
}

/**
 * Analyze a single text segment, returning sentiment, emotion, and score.
 */
export function analyzeSegmentText(text: string): {
  sentiment: SentimentLabel;
  emotion: EmotionLabel;
  score: number;
} {
  const sentiment = fallbackSentiment(text);
  const emotion = detectEmotion(text);
  let score = sentimentToScore(sentiment);

  // Adjust score based on emotion intensity
  if (emotion === "anger" || emotion === "disgust") {
    score = Math.min(score, -0.5);
  } else if (emotion === "joy") {
    score = Math.max(score, 0.5);
  } else if (emotion === "fear" || emotion === "sadness") {
    score = Math.min(score, -0.3);
  }

  return { sentiment, emotion, score };
}

// ---------------------------------------------------------------------------
// Modality fusion
// ---------------------------------------------------------------------------

/**
 * Compute effective weights based on which modalities are available.
 * Redistributes weight from missing modalities proportionally.
 */
export function computeEffectiveWeights(
  available: Record<ModalityKind, boolean>
): Record<ModalityKind, number> {
  let totalAvailable = 0;
  for (const [kind, isAvailable] of Object.entries(available)) {
    if (isAvailable) {
      totalAvailable += BASE_WEIGHTS[kind as ModalityKind];
    }
  }

  if (totalAvailable === 0) {
    // All missing — equal weight fallback
    return { transcript: 0.34, visual: 0.33, captions: 0.33 };
  }

  const effective: Record<ModalityKind, number> = {
    transcript: 0,
    visual: 0,
    captions: 0,
  };

  for (const kind of Object.keys(BASE_WEIGHTS) as ModalityKind[]) {
    if (available[kind]) {
      effective[kind] = BASE_WEIGHTS[kind] / totalAvailable;
    }
  }

  return effective;
}

// ---------------------------------------------------------------------------
// Risk detection
// ---------------------------------------------------------------------------

/**
 * Detect reputation risk alerts from segment scores.
 */
export function detectRiskAlerts(segments: SegmentAnalysis[]): RiskAlert[] {
  const alerts: RiskAlert[] = [];

  if (segments.length === 0) return alerts;

  const scores = segments.map((s) => s.score);
  const negativeSegments = segments.filter((s) => s.sentiment === "negative");
  const negativeRatio = negativeSegments.length / segments.length;

  // 1. Negative Surge: sharp drop in score between consecutive segments
  for (let i = 1; i < scores.length; i++) {
    const drop = scores[i - 1] - scores[i];
    if (drop >= 1.0) {
      alerts.push({
        type: "Negative Surge",
        severity: "high",
        description: `Sharp negative shift at ${segments[i].timeLabel} (score dropped by ${drop.toFixed(2)})`,
      });
    }
  }

  // 2. Possible Reputation Attack: >60% negative segments
  if (negativeRatio > 0.6 && segments.length >= 3) {
    alerts.push({
      type: "Possible Reputation Attack",
      severity: "high",
      description: `${(negativeRatio * 100).toFixed(0)}% of segments are negative — potential coordinated attack or crisis`,
    });
  }

  // 3. Emotional Volatility: high standard deviation in scores
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance =
    scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev > 0.5 && segments.length >= 4) {
    alerts.push({
      type: "Emotional Volatility",
      severity: "medium",
      description: `High emotional volatility detected (σ = ${stdDev.toFixed(2)}). Audience may be polarized.`,
    });
  }

  // 4. Sustained Negativity: 4+ consecutive negative segments
  let maxConsecutiveNeg = 0;
  let currentConsecutive = 0;
  for (const seg of segments) {
    if (seg.sentiment === "negative") {
      currentConsecutive++;
      maxConsecutiveNeg = Math.max(maxConsecutiveNeg, currentConsecutive);
    } else {
      currentConsecutive = 0;
    }
  }
  if (maxConsecutiveNeg >= 4) {
    alerts.push({
      type: "Sustained Negativity",
      severity: "high",
      description: `${maxConsecutiveNeg} consecutive negative segments detected — sustained negative perception`,
    });
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// Key moments extraction
// ---------------------------------------------------------------------------

/**
 * Extract the biggest positive peaks and negative dips from segment scores.
 */
export function extractKeyMoments(
  segments: SegmentAnalysis[],
  topN: number = 3
): KeyMoment[] {
  if (segments.length === 0) return [];

  const sorted = [...segments].sort((a, b) => a.score - b.score);

  const moments: KeyMoment[] = [];

  // Top negative dips
  const dips = sorted.filter((s) => s.score < 0).slice(0, topN);
  for (const s of dips) {
    moments.push({
      timeLabel: s.timeLabel,
      type: "dip",
      score: s.score,
      emotion: s.emotion,
      description: `Negative dip (${s.emotion}) — score ${s.score.toFixed(2)}`,
    });
  }

  // Top positive peaks
  const peaks = sorted
    .filter((s) => s.score > 0)
    .reverse()
    .slice(0, topN);
  for (const s of peaks) {
    moments.push({
      timeLabel: s.timeLabel,
      type: "peak",
      score: s.score,
      emotion: s.emotion,
      description: `Positive peak (${s.emotion}) — score ${s.score.toFixed(2)}`,
    });
  }

  return moments;
}

// ---------------------------------------------------------------------------
// Main MoodMap generator
// ---------------------------------------------------------------------------

export interface MoodMapInput {
  /** YouTube video URL or direct video URL */
  videoUrl: string;
  /** Video title (if known) */
  videoTitle?: string;
  /** Optional keyword context (celebrity / brand / movie / hospital name) */
  keywordContext?: string;
  /** Transcript segments (if available). Primary analysis modality. */
  transcriptSegments?: TranscriptSegment[];
  /** YouTube comments for the video (supplementary signal) */
  comments?: string[];
  /** Total video duration in seconds (if known) */
  durationSeconds?: number;
  /** Segment size override (default 10s) */
  segmentSize?: number;
}

/**
 * Generate a MoodMap report from available signals.
 *
 * If transcript segments are provided, they become the primary signal.
 * If only comments are available, they are distributed across segments.
 * If neither is available, a low-confidence report is generated.
 */
export function generateMoodMapReport(input: MoodMapInput): MoodMapReport {
  const segmentSize = input.segmentSize ?? DEFAULT_SEGMENT_SIZE;
  const hasTranscript =
    !!input.transcriptSegments && input.transcriptSegments.length > 0;
  const hasComments = !!input.comments && input.comments.length > 0;

  // Determine modality availability
  const modalityAvailable: Record<ModalityKind, boolean> = {
    transcript: hasTranscript,
    visual: false, // Visual emotion detection not available in current MVP
    captions: hasComments, // Use comments as proxy for captions
  };

  const effectiveWeights = computeEffectiveWeights(modalityAvailable);

  // Build modality status
  const modalities: ModalityStatus[] = [
    {
      kind: "transcript",
      available: hasTranscript,
      weight: effectiveWeights.transcript,
      note: hasTranscript
        ? "Audio+Transcript available — primary signal"
        : "Transcript not available — using fallback signals",
    },
    {
      kind: "visual",
      available: false,
      weight: effectiveWeights.visual,
      note: "Visual emotion detection not available in current version",
    },
    {
      kind: "captions",
      available: hasComments,
      weight: effectiveWeights.captions,
      note: hasComments
        ? "Comments/captions used as supplementary signal"
        : "No captions or comments available",
    },
  ];

  // Determine duration
  let durationSeconds = input.durationSeconds ?? 0;
  if (durationSeconds === 0 && hasTranscript) {
    const lastSeg =
      input.transcriptSegments![input.transcriptSegments!.length - 1];
    durationSeconds = lastSeg.endTime;
  }
  if (durationSeconds === 0 && hasComments) {
    // Estimate: ~10 seconds per comment
    durationSeconds = input.comments!.length * segmentSize;
  }
  if (durationSeconds === 0) {
    durationSeconds = segmentSize; // Minimum one segment
  }

  // Generate segments
  const numSegments = Math.max(1, Math.ceil(durationSeconds / segmentSize));
  const segments: SegmentAnalysis[] = [];

  for (let i = 0; i < numSegments; i++) {
    const startTime = i * segmentSize;
    const endTime = Math.min((i + 1) * segmentSize, durationSeconds);
    const timeLabel = `${formatTimeLabel(startTime)}–${formatTimeLabel(endTime)}`;

    // Gather text for this segment
    let segmentText = "";

    if (hasTranscript) {
      // Find transcript segments overlapping this time window
      const overlapping = input.transcriptSegments!.filter(
        (ts) => ts.endTime > startTime && ts.startTime < endTime
      );
      segmentText = overlapping.map((ts) => ts.text).join(" ");
    }

    if (hasComments && !segmentText.trim()) {
      // Distribute comments across segments
      const commentsPerSegment = Math.max(
        1,
        Math.ceil(input.comments!.length / numSegments)
      );
      const startIdx = i * commentsPerSegment;
      const endIdx = Math.min(startIdx + commentsPerSegment, input.comments!.length);
      segmentText = input.comments!.slice(startIdx, endIdx).join(" ");
    }

    if (!segmentText.trim()) {
      segmentText = "(no data for this segment)";
    }

    const analysis = analyzeSegmentText(segmentText);

    segments.push({
      index: i,
      startTime,
      endTime,
      timeLabel,
      sentiment: analysis.sentiment,
      emotion: analysis.emotion,
      score: parseFloat(analysis.score.toFixed(2)),
      snippet:
        segmentText.length > 120
          ? segmentText.slice(0, 117) + "..."
          : segmentText,
    });
  }

  // Compute overall score (average of segment scores)
  const overallScore = parseFloat(
    (
      segments.reduce((sum, s) => sum + s.score, 0) / segments.length
    ).toFixed(2)
  );

  // Overall sentiment from score
  const overallSentiment: SentimentLabel =
    overallScore > 0.1
      ? "positive"
      : overallScore < -0.1
        ? "negative"
        : "neutral";

  // Emotion distribution
  const emotionCounts: Record<EmotionLabel, number> = {
    anger: 0,
    joy: 0,
    sadness: 0,
    fear: 0,
    disgust: 0,
    surprise: 0,
    neutral: 0,
  };
  for (const seg of segments) {
    emotionCounts[seg.emotion]++;
  }

  const emotionDistribution: EmotionDistribution[] = Object.entries(emotionCounts)
    .filter(([, count]) => count > 0)
    .map(([emotion, count]) => ({
      emotion: emotion as EmotionLabel,
      count,
      percentage: parseFloat(
        ((count / segments.length) * 100).toFixed(1)
      ),
    }))
    .sort((a, b) => b.count - a.count);

  // Key moments
  const keyMoments = extractKeyMoments(segments);

  // Risk alerts
  const riskAlerts = detectRiskAlerts(segments);

  // Confidence
  let confidence: "high" | "medium" | "low" = "low";
  if (hasTranscript && segments.length >= 5) {
    confidence = "high";
  } else if (hasTranscript || (hasComments && segments.length >= 3)) {
    confidence = "medium";
  }

  return {
    videoUrl: input.videoUrl,
    videoTitle: input.videoTitle ?? "Unknown",
    keywordContext: input.keywordContext ?? "",
    modalities,
    durationSeconds,
    segmentSize,
    segments,
    overallScore,
    overallSentiment,
    emotionDistribution,
    keyMoments,
    riskAlerts,
    confidence,
    generatedAt: new Date().toISOString(),
  };
}
