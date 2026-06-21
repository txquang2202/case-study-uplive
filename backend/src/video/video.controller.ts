import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Res,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { VideoService } from "./video.service";
import { DownloadVideoDto, MergeClipsDto } from "../common/dtos";
import {
  VideoDownloadResponseDto,
  VideoInfoResponseDto,
  MergeResponseDto,
  ResourceUsageDto,
} from "../common/dtos/responses";
import * as fs from "fs";

/**
 * Video management controller
 * Handles endpoints for downloading, processing, and merging videos
 */
@Controller("api/videos")
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  /**
   * Downloads a YouTube video
   *
   * @param downloadDto - Contains the YouTube URL
   * @returns Video metadata including ID and duration
   */
  @Post("download")
  @HttpCode(HttpStatus.OK)
  async downloadVideo(
    @Body() downloadDto: DownloadVideoDto,
  ): Promise<VideoDownloadResponseDto> {
    const result = await this.videoService.downloadYouTubeVideo(
      downloadDto.url,
    );
    return {
      id: result.id,
      duration: result.duration,
      message: "Video downloaded successfully",
    };
  }

  /**
   * Gets information about a video
   *
   * @param videoId - The video identifier
   * @returns Video metadata including duration
   */
  @Get(":id/info")
  async getVideoInfo(
    @Param("id") videoId: string,
  ): Promise<VideoInfoResponseDto> {
    const videoPath = this.videoService.getVideoFile(videoId);
    const duration = await this.videoService.getVideoDuration(videoPath);
    return {
      id: videoId,
      duration,
    };
  }

  /**
   * Merges video clips into a single file
   *
   * @param videoId - The source video identifier
   * @param mergeDto - Contains clips to merge and transition settings
   * @returns Merged video metadata
   */
  @Post(":id/merge")
  @HttpCode(HttpStatus.OK)
  async mergeClips(
    @Param("id") videoId: string,
    @Body() mergeDto: MergeClipsDto,
  ): Promise<MergeResponseDto> {
    const videoPath = this.videoService.getVideoFile(videoId);
    const result = await this.videoService.mergeClips(videoPath, mergeDto);
    return {
      id: result.id,
      message: "Clips merged successfully",
    };
  }

  /**
   * Downloads the merged video file
   *
   * @param videoId - The merged video identifier
   * @param res - Express response object
   */
  @Get(":id/download")
  async downloadMergedVideo(
    @Param("id") videoId: string,
    @Res() res: Response,
  ): Promise<void> {
    const videoPath = this.videoService.getVideoFile(videoId);

    if (!fs.existsSync(videoPath)) {
      res.status(HttpStatus.NOT_FOUND).json({ error: "Video not found" });
      return;
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[:\-]/g, "")
      .replace("T", "-")
      .slice(0, 15);
    const filename = `edited-video-${timestamp}.mp4`;

    res.set({
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${filename}"`,
    });

    const stream = fs.createReadStream(videoPath);
    stream.pipe(res);

    stream.on("error", () => {
      if (!res.headersSent) {
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ error: "Failed to download video" });
      }
    });
  }

  /**
   * Gets current resource usage statistics
   *
   * @returns Resource usage information
   */
  @Get("resources/usage")
  getResourceUsage(): ResourceUsageDto {
    return this.videoService.getResourceUsage();
  }
}
