import { IsString, IsUrl } from "class-validator";

/**
 * DTO for YouTube video download request
 */
export class DownloadVideoDto {
  /**
   * YouTube URL of the video to download
   * @example "https://www.youtube.com/watch?v=..."
   */
  @IsString()
  @IsUrl()
  url!: string;
}
