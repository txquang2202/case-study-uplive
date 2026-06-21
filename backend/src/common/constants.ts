/**
 * Application-wide constants for video processing and configuration
 */

export const VIDEO_CONSTANTS = {
  // File paths
  UPLOADS_DIR: "/tmp/video-editor",

  // File size and duration limits
  MAX_VIDEO_SIZE: 500 * 1024 * 1024, // 500MB
  MAX_DURATION_SECONDS: 1800, // 30 minutes

  // FFmpeg timeouts (in milliseconds)
  DOWNLOAD_TIMEOUT: 300000, // 5 minutes
  CLIP_EXTRACTION_TIMEOUT: 60000, // 1 minute
  MERGE_TIMEOUT: 600000, // 10 minutes

  // Default values
  DEFAULT_TRANSITION: "cut" as const,
  SUPPORTED_TRANSITIONS: ["cut", "fade", "slide"] as const,
} as const;

export const HTTP_STATUS_MESSAGES = {
  INVALID_URL: "Invalid YouTube URL",
  VIDEO_REQUIRED: "Video not found",
  VIDEO_DURATION_EXCEEDED: (maxMinutes: number) =>
    `Video duration exceeds ${maxMinutes} minutes limit`,
  DOWNLOAD_FAILED: (reason: string) => `Failed to download video: ${reason}`,
  MERGE_FAILED: (reason: string) => `Failed to merge clips: ${reason}`,
  DURATION_FETCH_FAILED: "Failed to get video duration",
  CLIPS_REQUIRED: "At least one clip is required",
  INVALID_CLIP_RANGE: "Invalid clip range",
  START_TIME_INVALID: "Start time must be less than end time",
  END_TIME_INVALID: (duration: number) =>
    `End time cannot exceed video duration (${duration}s)`,
} as const;
