import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Res,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { VideoService } from "./video.service";
import * as fs from "fs";

interface DownloadRequest {
  url: string;
}

interface MergeRequest {
  clips: Array<{ start: number; end: number }>;
  transition?: "fade" | "cut" | "slide";
}

@Controller("api/videos")
export class VideoController {
  private readonly logger = new Logger(VideoController.name);

  constructor(private readonly videoService: VideoService) {}

  @Post("download")
  async downloadVideo(@Body() body: DownloadRequest) {
    try {
      this.logger.log(`[DOWNLOAD] Received request for URL: ${body.url}`);
      if (!body.url) {
        throw new BadRequestException("YouTube URL is required");
      }
      this.logger.log(`[DOWNLOAD] Starting download...`);
      const result = await this.videoService.downloadYouTubeVideo(body.url);
      this.logger.log(`[DOWNLOAD] Success: ${result.id} (${result.duration}s)`);
      return {
        id: result.id,
        duration: result.duration,
        message: "Video downloaded successfully",
      };
    } catch (error) {
      this.logger.error(`[DOWNLOAD] Error: ${error}`);
      throw error;
    }
  }

  @Get(":id/info")
  async getVideoInfo(@Param("id") videoId: string) {
    try {
      const videoPath = this.videoService.getVideoFile(videoId);
      const duration = await this.videoService.getVideoDuration(videoPath);
      return {
        id: videoId,
        duration,
      };
    } catch (error) {
      throw new BadRequestException("Video not found");
    }
  }

  @Post(":id/merge")
  async mergeClips(@Param("id") videoId: string, @Body() body: MergeRequest) {
    try {
      this.logger.log(`[MERGE] Received merge request for video: ${videoId}`);
      this.logger.log(
        `[MERGE] Clips: ${body.clips.length}, Transition: ${body.transition}`,
      );
      const videoPath = this.videoService.getVideoFile(videoId);
      this.logger.log(`[MERGE] Video path: ${videoPath}`);
      this.logger.log(`[MERGE] Starting merge operation...`);
      const result = await this.videoService.mergeClips(videoPath, body);
      this.logger.log(`[MERGE] Success: ${result.id}`);
      return {
        id: result.id,
        message: "Clips merged successfully",
      };
    } catch (error) {
      this.logger.error(`[MERGE] Error: ${error}`);
      throw error;
    }
  }

  @Get(":id/download")
  async downloadMergedVideo(
    @Param("id") videoId: string,
    @Res() res: Response,
  ) {
    try {
      const videoPath = this.videoService.getVideoFile(videoId);

      if (!fs.existsSync(videoPath)) {
        return res.status(404).json({ error: "Video not found" });
      }

      // Generate meaningful filename with timestamp
      const now = new Date();
      const timestamp = now
        .toISOString()
        .replace(/[:\-]/g, "")
        .replace("T", "-")
        .slice(0, 15); // Format: 20260621-082427
      const filename = `edited-video-${timestamp}.mp4`;

      res.set({
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${filename}"`,
      });

      const stream = fs.createReadStream(videoPath);
      stream.pipe(res);

      stream.on("end", () => {
        // Optional: cleanup after download
        // this.videoService.cleanupVideo(videoId);
      });

      stream.on("error", () => {
        res.status(500).json({ error: "Failed to download video" });
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  @Get("resources/usage")
  getResourceUsage() {
    return this.videoService.getResourceUsage();
  }
}
