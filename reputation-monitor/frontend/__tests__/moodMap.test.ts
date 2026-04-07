/**
 * Automated tests for the MoodMap feature.
 *
 * Verifies:
 *  1. Emotion detection from text
 *  2. Sentiment-to-score conversion
 *  3. Segment analysis
 *  4. Modality weight computation
 *  5. Risk alert detection
 *  6. Key moment extraction
 *  7. Full report generation
 *  8. Time formatting
 *  9. Video ID extraction (API helper)
 * 10. ISO duration parsing (API helper)
 */

import { describe, it, expect } from "vitest";
import {
  detectEmotion,
  sentimentToScore,
  analyzeSegmentText,
  computeEffectiveWeights,
  detectRiskAlerts,
  extractKeyMoments,
  formatTimeLabel,
  generateMoodMapReport,
  type SegmentAnalysis,
  type EmotionLabel,
} from "../lib/moodMap";
import { extractVideoId, parseIsoDuration } from "../pages/api/mood-map";

// ---------------------------------------------------------------------------
// 1. Emotion detection
// ---------------------------------------------------------------------------

describe("Emotion Detection", () => {
  it("detects joy from positive text", () => {
    expect(detectEmotion("I love this amazing wonderful video!")).toBe("joy");
  });

  it("detects anger from angry text", () => {
    expect(detectEmotion("This makes me furious and angry")).toBe("anger");
  });

  it("detects sadness from sad text", () => {
    expect(detectEmotion("This is so sad and heartbroken, crying")).toBe("sadness");
  });

  it("detects fear from fearful text", () => {
    expect(detectEmotion("I am terrified and scared of this")).toBe("fear");
  });

  it("detects disgust from disgusting text", () => {
    expect(detectEmotion("That is disgusting and revolting")).toBe("disgust");
  });

  it("detects surprise from surprising text", () => {
    expect(detectEmotion("Wow this is so surprising and unexpected")).toBe("surprise");
  });

  it("returns neutral for generic text", () => {
    expect(detectEmotion("The video is about cooking recipes")).toBe("neutral");
  });

  it("always returns a valid emotion label", () => {
    const validEmotions: EmotionLabel[] = [
      "anger", "joy", "sadness", "fear", "disgust", "surprise", "neutral",
    ];
    const texts = ["hello", "", "🎉", "mixed feelings of love and hate"];
    for (const text of texts) {
      expect(validEmotions).toContain(detectEmotion(text));
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Sentiment-to-score conversion
// ---------------------------------------------------------------------------

describe("Sentiment to Score", () => {
  it("maps positive to +0.7", () => {
    expect(sentimentToScore("positive")).toBe(0.7);
  });

  it("maps negative to -0.7", () => {
    expect(sentimentToScore("negative")).toBe(-0.7);
  });

  it("maps neutral to 0.0", () => {
    expect(sentimentToScore("neutral")).toBe(0.0);
  });
});

// ---------------------------------------------------------------------------
// 3. Segment analysis
// ---------------------------------------------------------------------------

describe("Segment Text Analysis", () => {
  it("returns valid structure", () => {
    const result = analyzeSegmentText("This is a great video!");
    expect(result).toHaveProperty("sentiment");
    expect(result).toHaveProperty("emotion");
    expect(result).toHaveProperty("score");
    expect(["positive", "negative", "neutral"]).toContain(result.sentiment);
    expect(result.score).toBeGreaterThanOrEqual(-1);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it("positive text yields positive sentiment", () => {
    const result = analyzeSegmentText("I love this amazing fantastic great content!");
    expect(result.sentiment).toBe("positive");
    expect(result.score).toBeGreaterThan(0);
  });

  it("negative text yields negative sentiment", () => {
    const result = analyzeSegmentText("This is terrible awful garbage");
    expect(result.sentiment).toBe("negative");
    expect(result.score).toBeLessThan(0);
  });

  it("adjusts score for anger emotion", () => {
    const result = analyzeSegmentText("I am angry and furious about this terrible thing");
    expect(result.score).toBeLessThanOrEqual(-0.5);
  });
});

// ---------------------------------------------------------------------------
// 4. Modality weight computation
// ---------------------------------------------------------------------------

describe("Modality Weight Computation", () => {
  it("returns base weights when all modalities available", () => {
    const weights = computeEffectiveWeights({
      transcript: true,
      visual: true,
      captions: true,
    });
    expect(weights.transcript).toBeCloseTo(0.6, 1);
    expect(weights.visual).toBeCloseTo(0.25, 1);
    expect(weights.captions).toBeCloseTo(0.15, 1);
  });

  it("redistributes weight when visual is missing", () => {
    const weights = computeEffectiveWeights({
      transcript: true,
      visual: false,
      captions: true,
    });
    expect(weights.visual).toBe(0);
    expect(weights.transcript).toBeGreaterThan(0.6);
    expect(weights.captions).toBeGreaterThan(0.15);
    // Weights should sum to ~1.0
    const total = weights.transcript + weights.visual + weights.captions;
    expect(total).toBeCloseTo(1.0, 1);
  });

  it("gives full weight to transcript when only transcript available", () => {
    const weights = computeEffectiveWeights({
      transcript: true,
      visual: false,
      captions: false,
    });
    expect(weights.transcript).toBeCloseTo(1.0, 1);
    expect(weights.visual).toBe(0);
    expect(weights.captions).toBe(0);
  });

  it("handles all modalities missing", () => {
    const weights = computeEffectiveWeights({
      transcript: false,
      visual: false,
      captions: false,
    });
    // Should return equal-ish fallback weights
    const total = weights.transcript + weights.visual + weights.captions;
    expect(total).toBeCloseTo(1.0, 1);
  });
});

// ---------------------------------------------------------------------------
// 5. Risk alert detection
// ---------------------------------------------------------------------------

describe("Risk Alert Detection", () => {
  function makeSegment(index: number, score: number, sentiment: "positive" | "negative" | "neutral"): SegmentAnalysis {
    return {
      index,
      startTime: index * 10,
      endTime: (index + 1) * 10,
      timeLabel: `${index * 10}s`,
      sentiment,
      emotion: "neutral",
      score,
      snippet: "test",
    };
  }

  it("returns empty for all-positive segments", () => {
    const segments = [
      makeSegment(0, 0.7, "positive"),
      makeSegment(1, 0.5, "positive"),
      makeSegment(2, 0.6, "positive"),
    ];
    const alerts = detectRiskAlerts(segments);
    expect(alerts.length).toBe(0);
  });

  it("detects Negative Surge on sharp score drop", () => {
    const segments = [
      makeSegment(0, 0.7, "positive"),
      makeSegment(1, -0.5, "negative"),
    ];
    const alerts = detectRiskAlerts(segments);
    expect(alerts.some((a) => a.type === "Negative Surge")).toBe(true);
  });

  it("detects Possible Reputation Attack with >60% negative", () => {
    const segments = [
      makeSegment(0, -0.5, "negative"),
      makeSegment(1, -0.6, "negative"),
      makeSegment(2, -0.4, "negative"),
      makeSegment(3, 0.2, "positive"),
    ];
    const alerts = detectRiskAlerts(segments);
    expect(alerts.some((a) => a.type === "Possible Reputation Attack")).toBe(true);
  });

  it("detects Sustained Negativity with 4+ consecutive negative", () => {
    const segments = [
      makeSegment(0, -0.3, "negative"),
      makeSegment(1, -0.5, "negative"),
      makeSegment(2, -0.4, "negative"),
      makeSegment(3, -0.6, "negative"),
      makeSegment(4, 0.3, "positive"),
    ];
    const alerts = detectRiskAlerts(segments);
    expect(alerts.some((a) => a.type === "Sustained Negativity")).toBe(true);
  });

  it("detects Emotional Volatility with high variance", () => {
    const segments = [
      makeSegment(0, 0.8, "positive"),
      makeSegment(1, -0.8, "negative"),
      makeSegment(2, 0.7, "positive"),
      makeSegment(3, -0.9, "negative"),
    ];
    const alerts = detectRiskAlerts(segments);
    expect(alerts.some((a) => a.type === "Emotional Volatility")).toBe(true);
  });

  it("returns empty for empty segments", () => {
    expect(detectRiskAlerts([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 6. Key moment extraction
// ---------------------------------------------------------------------------

describe("Key Moment Extraction", () => {
  function makeSegment(index: number, score: number): SegmentAnalysis {
    return {
      index,
      startTime: index * 10,
      endTime: (index + 1) * 10,
      timeLabel: `${index}:${(index * 10).toString().padStart(2, "0")}`,
      sentiment: score > 0 ? "positive" : score < 0 ? "negative" : "neutral",
      emotion: score > 0 ? "joy" : score < 0 ? "anger" : "neutral",
      score,
      snippet: "test",
    };
  }

  it("extracts both peaks and dips", () => {
    const segments = [
      makeSegment(0, 0.8),
      makeSegment(1, -0.6),
      makeSegment(2, 0.3),
      makeSegment(3, -0.9),
      makeSegment(4, 0.5),
    ];
    const moments = extractKeyMoments(segments);
    expect(moments.some((m) => m.type === "peak")).toBe(true);
    expect(moments.some((m) => m.type === "dip")).toBe(true);
  });

  it("returns empty for empty segments", () => {
    expect(extractKeyMoments([])).toEqual([]);
  });

  it("caps at topN results per type", () => {
    const segments = Array.from({ length: 20 }, (_, i) =>
      makeSegment(i, i % 2 === 0 ? 0.5 + i * 0.01 : -0.5 - i * 0.01)
    );
    const moments = extractKeyMoments(segments, 2);
    const peaks = moments.filter((m) => m.type === "peak");
    const dips = moments.filter((m) => m.type === "dip");
    expect(peaks.length).toBeLessThanOrEqual(2);
    expect(dips.length).toBeLessThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// 7. Full report generation
// ---------------------------------------------------------------------------

describe("MoodMap Report Generation", () => {
  it("generates a valid report with transcript segments", () => {
    const report = generateMoodMapReport({
      videoUrl: "https://www.youtube.com/watch?v=test123",
      videoTitle: "Test Video",
      keywordContext: "test brand",
      transcriptSegments: [
        { startTime: 0, endTime: 10, text: "This is amazing and wonderful content" },
        { startTime: 10, endTime: 20, text: "Now things get terrible and awful" },
        { startTime: 20, endTime: 30, text: "Back to being happy and great" },
      ],
      durationSeconds: 30,
    });

    expect(report.videoUrl).toBe("https://www.youtube.com/watch?v=test123");
    expect(report.videoTitle).toBe("Test Video");
    expect(report.keywordContext).toBe("test brand");
    expect(report.segments.length).toBe(3);
    expect(report.overallScore).toBeGreaterThanOrEqual(-1);
    expect(report.overallScore).toBeLessThanOrEqual(1);
    expect(["positive", "negative", "neutral"]).toContain(report.overallSentiment);
    expect(report.emotionDistribution.length).toBeGreaterThan(0);
    expect(report.generatedAt).toBeTruthy();
    expect(report.confidence).toBe("medium");
  });

  it("generates a report with only comments", () => {
    const report = generateMoodMapReport({
      videoUrl: "https://youtu.be/abc",
      comments: [
        "I love this!",
        "Terrible video",
        "Okay I guess",
      ],
    });

    expect(report.segments.length).toBeGreaterThan(0);
    // 3 comments → 3 segments → medium confidence (hasComments && segments >= 3)
    expect(report.confidence).toBe("medium");
  });

  it("generates a low-confidence report with no data", () => {
    const report = generateMoodMapReport({
      videoUrl: "https://example.com/video",
    });

    expect(report.segments.length).toBeGreaterThan(0);
    expect(report.confidence).toBe("low");
    expect(report.videoTitle).toBe("Unknown");
  });

  it("overall score is between -1.0 and 1.0", () => {
    const report = generateMoodMapReport({
      videoUrl: "test",
      transcriptSegments: [
        { startTime: 0, endTime: 10, text: "hate hate hate hate hate" },
        { startTime: 10, endTime: 20, text: "love love love love love" },
      ],
      durationSeconds: 20,
    });

    expect(report.overallScore).toBeGreaterThanOrEqual(-1);
    expect(report.overallScore).toBeLessThanOrEqual(1);
  });

  it("emotion distribution percentages sum to ~100%", () => {
    const report = generateMoodMapReport({
      videoUrl: "test",
      transcriptSegments: [
        { startTime: 0, endTime: 10, text: "angry furious" },
        { startTime: 10, endTime: 20, text: "happy love" },
        { startTime: 20, endTime: 30, text: "neutral stuff" },
        { startTime: 30, endTime: 40, text: "scared terrified" },
      ],
      durationSeconds: 40,
    });

    const totalPct = report.emotionDistribution.reduce(
      (sum, e) => sum + e.percentage,
      0
    );
    expect(totalPct).toBeCloseTo(100, 0);
  });
});

// ---------------------------------------------------------------------------
// 8. Time formatting
// ---------------------------------------------------------------------------

describe("Time Formatting", () => {
  it("formats 0 seconds as 0:00", () => {
    expect(formatTimeLabel(0)).toBe("0:00");
  });

  it("formats 65 seconds as 1:05", () => {
    expect(formatTimeLabel(65)).toBe("1:05");
  });

  it("formats 600 seconds as 10:00", () => {
    expect(formatTimeLabel(600)).toBe("10:00");
  });

  it("formats 3661 seconds as 61:01", () => {
    expect(formatTimeLabel(3661)).toBe("61:01");
  });
});

// ---------------------------------------------------------------------------
// 9. Video ID extraction
// ---------------------------------------------------------------------------

describe("Video ID Extraction", () => {
  it("extracts from standard watch URL", () => {
    expect(extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("extracts from short URL", () => {
    expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts from embed URL", () => {
    expect(
      extractVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")
    ).toBe("dQw4w9WgXcQ");
  });

  it("accepts a plain 11-char video ID", () => {
    expect(extractVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("returns null for invalid input", () => {
    expect(extractVideoId("")).toBeNull();
    expect(extractVideoId("not-a-url")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 10. ISO duration parsing
// ---------------------------------------------------------------------------

describe("ISO Duration Parsing", () => {
  it("parses PT1H2M30S to 3750 seconds", () => {
    expect(parseIsoDuration("PT1H2M30S")).toBe(3750);
  });

  it("parses PT5M to 300 seconds", () => {
    expect(parseIsoDuration("PT5M")).toBe(300);
  });

  it("parses PT30S to 30 seconds", () => {
    expect(parseIsoDuration("PT30S")).toBe(30);
  });

  it("parses PT1H to 3600 seconds", () => {
    expect(parseIsoDuration("PT1H")).toBe(3600);
  });

  it("returns 0 for invalid format", () => {
    expect(parseIsoDuration("invalid")).toBe(0);
    expect(parseIsoDuration("")).toBe(0);
  });
});
