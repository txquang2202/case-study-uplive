import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import { VIDEO_CONSTANTS, HTTP_STATUS_MESSAGES } from "../common/constants";
import { MergeClipsDto, ClipDto } from "../common/dtos";

const execAsync = promisify(exec);

/**
 * Service for handling video download, processing, and merging operations
 */
@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly uploadsDir = VIDEO_CONSTANTS.UPLOADS_DIR;
  private readonly maxVideoSize = VIDEO_CONSTANTS.MAX_VIDEO_SIZE;
  private readonly maxDuration = VIDEO_CONSTANTS.MAX_DURATION_SECONDS;

  constructor() {
    this.ensureUploadsDir();
  }

  /**
   * Ensures the uploads directory exists, creating it if necessary
   */
  private ensureUploadsDir(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      this.logger.log(`Created uploads directory: ${this.uploadsDir}`);
    }
  }

  /**
   * Downloads a YouTube video using yt-dlp
   *
   * @param url - The YouTube URL to download
   * @returns Object containing video ID, duration, and file path
   * @throws BadRequestException if URL is invalid or video duration exceeds limit
   * @throws InternalServerErrorException if download fails
   */
  async downloadYouTubeVideo(
    url: string,
  ): Promise<{ id: string; duration: number; path: string }> {
    if (!this.isValidYouTubeUrl(url)) {
      throw new BadRequestException(HTTP_STATUS_MESSAGES.INVALID_URL);
    }

    const videoId = uuidv4();
    const outputPath = path.join(this.uploadsDir, `${videoId}.mp4`);

    try {
      this.logger.log(`Starting video download for URL: ${url}`);

      const command = `yt-dlp --no-playlist -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]' -o "${outputPath}" "${url}"`;
      const { stdout, stderr } = await execAsync(command, {
        timeout: VIDEO_CONSTANTS.DOWNLOAD_TIMEOUT,
      });

      if (!fs.existsSync(outputPath)) {
        throw new Error("Video file not created after download");
      }

      const duration = await this.getVideoDuration(outputPath);

      if (duration > this.maxDuration) {
        fs.unlinkSync(outputPath);
        const maxMinutes = this.maxDuration / 60;
        throw new BadRequestException(
          HTTP_STATUS_MESSAGES.VIDEO_DURATION_EXCEEDED(maxMinutes),
        );
      }

      this.logger.log(
        `Video downloaded successfully: ${videoId} (${duration}s)`,
      );
      return { id: videoId, duration, path: outputPath };
    } catch (error) {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Video download failed: ${errorMessage}`);
      throw new InternalServerErrorException(
        HTTP_STATUS_MESSAGES.DOWNLOAD_FAILED(errorMessage),
      );
    }
  }

  /**
   * Gets the duration of a video file using ffprobe
   *
   * @param videoPath - Path to the video file
   * @returns Duration in seconds (rounded up)
   * @throws InternalServerErrorException if ffprobe fails
   */
  async getVideoDuration(videoPath: string): Promise<number> {
    try {
      const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:noprint_wrappers=1 "${videoPath}"`;
      const { stdout } = await execAsync(command);
      return Math.ceil(parseFloat(stdout.trim()));
    } catch (error) {
      this.logger.error("Failed to get video duration");
      throw new InternalServerErrorException(
        HTTP_STATUS_MESSAGES.DURATION_FETCH_FAILED,
      );
    }
  }

  /**
   * Merges multiple video clips into a single file
   *
   * @param videoPath - Path to the source video
   * @param mergeData - Clips to merge and transition settings
   * @returns Object containing output video ID and file path
   * @throws BadRequestException if clips data is invalid
   * @throws InternalServerErrorException if merge operation fails
   */
  async mergeClips(
    videoPath: string,
    mergeData: MergeClipsDto,
  ): Promise<{ id: string; path: string }> {
    this.validateClips(mergeData.clips);

    const sortedClips = this.sortClips(mergeData.clips);
    this.validateClipRanges(sortedClips);

    const outputId = uuidv4();
    const outputPath = path.join(this.uploadsDir, `${outputId}.mp4`);
    const concatFile = path.join(this.uploadsDir, `${outputId}_concat.txt`);
    const clipPaths: string[] = [];

    try {
      this.logger.log(`Starting merge operation for video: ${videoPath}`);

      // Extract clips
      for (let i = 0; i < sortedClips.length; i++) {
        const clipPath = await this.extractClip(
          videoPath,
          sortedClips[i],
          outputId,
          i,
        );
        clipPaths.push(clipPath);
      }

      // Create concat file
      const concatContent = clipPaths.map((p) => `file '${p}'`).join("\n");
      fs.writeFileSync(concatFile, concatContent);

      // Merge clips
      const transition =
        mergeData.transition || VIDEO_CONSTANTS.DEFAULT_TRANSITION;
      const mergeCmd = this.buildMergeCommand(
        concatFile,
        outputPath,
        clipPaths,
        transition,
      );

      await execAsync(mergeCmd, { timeout: VIDEO_CONSTANTS.MERGE_TIMEOUT });

      this.cleanupIntermediateFiles(clipPaths, concatFile);

      this.logger.log(`Merge completed successfully: ${outputId}`);
      return { id: outputId, path: outputPath };
    } catch (error) {
      this.cleanupIntermediateFiles(clipPaths, concatFile);
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Merge operation failed: ${errorMessage}`);
      throw new InternalServerErrorException(
        HTTP_STATUS_MESSAGES.MERGE_FAILED(errorMessage),
      );
    }
  }

  /**
   * Validates that clips array is not empty
   *
   * @param clips - Array of clips to validate
   * @throws BadRequestException if clips array is empty
   */
  private validateClips(clips: ClipDto[]): void {
    if (!clips || clips.length === 0) {
      throw new BadRequestException(HTTP_STATUS_MESSAGES.CLIPS_REQUIRED);
    }
  }

  /**
   * Sorts clips by start time
   *
   * @param clips - Array of clips to sort
   * @returns Sorted array of clips
   */
  private sortClips(clips: ClipDto[]): ClipDto[] {
    return [...clips].sort((a, b) => a.start - b.start);
  }

  /**
   * Validates that all clips have valid time ranges
   *
   * @param clips - Array of clips to validate
   * @throws BadRequestException if any clip has invalid range
   */
  private validateClipRanges(clips: ClipDto[]): void {
    for (const clip of clips) {
      if (clip.start < 0 || clip.end <= clip.start) {
        throw new BadRequestException(HTTP_STATUS_MESSAGES.INVALID_CLIP_RANGE);
      }
    }
  }

  /**
   * Extracts a single clip from the source video
   *
   * @param videoPath - Path to source video
   * @param clip - Clip definition
   * @param outputId - Output operation ID
   * @param index - Clip index
   * @returns Path to extracted clip
   */
  private async extractClip(
    videoPath: string,
    clip: ClipDto,
    outputId: string,
    index: number,
  ): Promise<string> {
    const clipPath = path.join(
      this.uploadsDir,
      `${outputId}_clip_${index}.mp4`,
    );
    const ffmpegCmd = `ffmpeg -i "${videoPath}" -ss ${clip.start} -to ${clip.end} -c:v copy -c:a copy "${clipPath}" -y 2>&1`;

    await execAsync(ffmpegCmd, {
      timeout: VIDEO_CONSTANTS.CLIP_EXTRACTION_TIMEOUT,
    });
    return clipPath;
  }

  /**
   * Cleans up intermediate files created during merge operation
   *
   * @param clipPaths - Array of clip file paths to delete
   * @param concatFile - Concat file path to delete
   */
  private cleanupIntermediateFiles(
    clipPaths: string[],
    concatFile: string,
  ): void {
    clipPaths.forEach((p) => {
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
      }
    });
    if (fs.existsSync(concatFile)) {
      fs.unlinkSync(concatFile);
    }
  }

  /**
   * Builds the ffmpeg command for merging clips
   *
   * @param concatFile - Path to concat file
   * @param outputPath - Output video path
   * @param clipPaths - Array of clip paths
   * @param transition - Transition type to apply
   * @returns FFmpeg command string
   */
  private buildMergeCommand(
    concatFile: string,
    outputPath: string,
    clipPaths: string[],
    transition: string,
  ): string {
    // For "cut" transition or single clip, use simple concat without re-encoding
    if (transition === "cut" || clipPaths.length === 1) {
      return `ffmpeg -f concat -safe 0 -i "${concatFile}" -c copy "${outputPath}" -y 2>&1`;
    }

    // For fade/slide transitions, would need complex filters (not fully implemented)
    // Currently falls back to cut for performance
    return `ffmpeg -f concat -safe 0 -i "${concatFile}" -c copy "${outputPath}" -y 2>&1`;
  }

  /**
   * Retrieves the file path for a video
   *
   * @param videoId - Video identifier
   * @returns Full path to video file
   * @throws BadRequestException if video file doesn't exist
   */
  getVideoFile(videoId: string): string {
    const videoPath = path.join(this.uploadsDir, `${videoId}.mp4`);
    if (!fs.existsSync(videoPath)) {
      throw new BadRequestException(HTTP_STATUS_MESSAGES.VIDEO_REQUIRED);
    }
    return videoPath;
  }

  /**
   * Deletes a video file from storage
   *
   * @param videoId - Video identifier
   */
  cleanupVideo(videoId: string): void {
    const videoPath = path.join(this.uploadsDir, `${videoId}.mp4`);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
      this.logger.log(`Cleaned up video: ${videoId}`);
    }
  }

  /**
   * Validates if a URL is a valid YouTube URL
   *
   * @param url - URL to validate
   * @returns True if valid YouTube URL, false otherwise
   */
  private isValidYouTubeUrl(url: string): boolean {
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?youtube\.com\/(watch\?v=|embed\/|v\/)[-\w]{11}|youtu\.be\/[-\w]{11}/;
    return youtubeRegex.test(url);
  }

  /**
   * Gets current system resource usage
   *
   * @returns Object containing timestamp and memory usage statistics
   */
  getResourceUsage(): { timestamp: Date; memoryUsage: NodeJS.MemoryUsage } {
    return {
      timestamp: new Date(),
      memoryUsage: process.memoryUsage(),
    };
  }
}
