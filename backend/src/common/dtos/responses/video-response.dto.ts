/**
 * DTO for video download response
 */
export class VideoDownloadResponseDto {
  /**
   * Unique video identifier
   */
  id!: string;

  /**
   * Video duration in seconds
   */
  duration!: number;

  /**
   * Success message
   */
  message!: string;
}

/**
 * DTO for video info response
 */
export class VideoInfoResponseDto {
  /**
   * Unique video identifier
   */
  id!: string;

  /**
   * Video duration in seconds
   */
  duration!: number;
}

/**
 * DTO for merge operation response
 */
export class MergeResponseDto {
  /**
   * Unique merged video identifier
   */
  id!: string;

  /**
   * Success message
   */
  message!: string;
}

/**
 * DTO for resource usage response
 */
export class ResourceUsageDto {
  /**
   * Timestamp of measurement
   */
  timestamp!: Date;

  /**
   * Node.js memory usage statistics
   */
  memoryUsage!: NodeJS.MemoryUsage;
}
