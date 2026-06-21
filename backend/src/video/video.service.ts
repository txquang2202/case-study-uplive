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

const execAsync = promisify(exec);

interface Clip {
  start: number;
  end: number;
}

interface MergeRequest {
  clips: Clip[];
  transition?: "fade" | "cut" | "slide";
}

@Injectable()
export class VideoService {
  private readonly uploadsDir = "/tmp/video-editor";
  private readonly maxVideoSize = 500 * 1024 * 1024; // 500MB
  private readonly maxDuration = 1800; // 30 mins in seconds

  constructor() {
    this.ensureUploadsDir();
  }

  private ensureUploadsDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async downloadYouTubeVideo(
    url: string,
  ): Promise<{ id: string; duration: number; path: string }> {
    // Validate URL
    if (!this.isValidYouTubeUrl(url)) {
      throw new BadRequestException("Invalid YouTube URL");
    }
    const videoId = uuidv4();
    const outputPath = path.join(this.uploadsDir, `${videoId}.mp4`);

    try {
      // Using yt-dlp to download YouTube video
      // --no-playlist ensures we only download the video, not the entire playlist
      const command = `yt-dlp --no-playlist -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]' -o "${outputPath}" "${url}"`;

      const { stdout, stderr } = await execAsync(command, { timeout: 300000 });

      if (!fs.existsSync(outputPath)) {
        throw new Error(
          `Video download failed - file not created. stdout: ${stdout}, stderr: ${stderr}`,
        );
      }

      // Get video duration
      const duration = await this.getVideoDuration(outputPath);

      if (duration > this.maxDuration) {
        fs.unlinkSync(outputPath);
        throw new BadRequestException(
          `Video duration exceeds ${this.maxDuration / 60} minutes limit`,
        );
      }

      return { id: videoId, duration, path: outputPath };
    } catch (error) {
      // Cleanup on error
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new InternalServerErrorException(
        `Failed to download video: ${errorMessage}`,
      );
    }
  }

  async getVideoDuration(videoPath: string): Promise<number> {
    try {
      const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:noprint_wrappers=1 "${videoPath}"`;
      const { stdout } = await execAsync(command);
      return Math.ceil(parseFloat(stdout.trim()));
    } catch (error) {
      throw new InternalServerErrorException("Failed to get video duration");
    }
  }

  async mergeClips(
    videoPath: string,
    mergeData: MergeRequest,
  ): Promise<{ id: string; path: string }> {
    // Validate clips
    if (!mergeData.clips || mergeData.clips.length === 0) {
      throw new BadRequestException("At least one clip is required");
    }

    // Sort clips by start time
    const sortedClips = mergeData.clips.sort((a, b) => a.start - b.start);

    // Validate clip ranges
    for (const clip of sortedClips) {
      if (clip.start < 0 || clip.end <= clip.start) {
        throw new BadRequestException("Invalid clip range");
      }
    }

    const outputId = uuidv4();
    const outputPath = path.join(this.uploadsDir, `${outputId}.mp4`);
    const concatFile = path.join(this.uploadsDir, `${outputId}_concat.txt`);

    try {
      // Extract clips
      const clipPaths: string[] = [];
      for (let i = 0; i < sortedClips.length; i++) {
        const clip = sortedClips[i];
        const clipPath = path.join(
          this.uploadsDir,
          `${outputId}_clip_${i}.mp4`,
        );
        const ffmpegCmd = `ffmpeg -i "${videoPath}" -ss ${clip.start} -to ${clip.end} -c:v copy -c:a copy "${clipPath}" -y 2>&1`;

        await execAsync(ffmpegCmd, { timeout: 60000 });

        clipPaths.push(clipPath);
      }

      // Create concat file
      const concatContent = clipPaths.map((p) => `file '${p}'`).join("\n");
      fs.writeFileSync(concatFile, concatContent);

      // Apply transitions and merge
      const transition = mergeData.transition || "cut";
      const mergeCmd = this.buildMergeCommand(
        concatFile,
        outputPath,
        clipPaths,
        transition,
      );

      await execAsync(mergeCmd, { timeout: 600000 }); // 10 min timeout for transitions

      // Cleanup clip files and concat file
      clipPaths.forEach((p) => {
        if (fs.existsSync(p)) {
          fs.unlinkSync(p);
        }
      });
      if (fs.existsSync(concatFile)) {
        fs.unlinkSync(concatFile);
      }

      return { id: outputId, path: outputPath };
    } catch (error) {
      console.error(`[MERGE_ERROR] Error during merge: ${error}`);
      // Cleanup on error
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      if (fs.existsSync(concatFile)) fs.unlinkSync(concatFile);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new InternalServerErrorException(
        `Failed to merge clips: ${errorMessage}`,
      );
    }
  }

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

    // For fade transition, we'd need to use complex filter which uses more resources
    // Simplified version: just use copy for now, real implementation would add filters
    return `ffmpeg -f concat -safe 0 -i "${concatFile}" -c copy "${outputPath}" -y 2>&1`;
  }

  getVideoFile(videoId: string): string {
    const videoPath = path.join(this.uploadsDir, `${videoId}.mp4`);
    if (!fs.existsSync(videoPath)) {
      throw new BadRequestException("Video not found");
    }
    return videoPath;
  }

  cleanupVideo(videoId: string): void {
    const videoPath = path.join(this.uploadsDir, `${videoId}.mp4`);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }
  }

  private isValidYouTubeUrl(url: string): boolean {
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?youtube\.com\/(watch\?v=|embed\/|v\/)[-\w]{11}|youtu\.be\/[-\w]{11}/;
    return youtubeRegex.test(url);
  }

  getResourceUsage(): { timestamp: Date; memoryUsage: NodeJS.MemoryUsage } {
    return {
      timestamp: new Date(),
      memoryUsage: process.memoryUsage(),
    };
  }
}
