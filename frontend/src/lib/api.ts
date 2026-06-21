import axios, { AxiosError } from "axios";

/**
 * API client configuration and utilities
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 300000,
});

/**
 * Response type for video download
 */
export interface VideoDownloadResponse {
  id: string;
  duration: number;
  message: string;
}

/**
 * Response type for video info
 */
export interface VideoInfoResponse {
  id: string;
  duration: number;
}

/**
 * Response type for merge operation
 */
export interface MergeResponse {
  id: string;
  message: string;
}

/**
 * Clip data type
 */
export interface Clip {
  start: number;
  end: number;
}

/**
 * Merge request payload
 */
export interface MergeRequest {
  clips: Clip[];
  transition?: "cut" | "fade" | "slide";
}

/**
 * Downloads a YouTube video
 *
 * @param url - YouTube URL to download
 * @returns Video metadata
 */
export async function downloadVideo(
  url: string,
): Promise<VideoDownloadResponse> {
  const { data } = await apiClient.post<VideoDownloadResponse>(
    "/api/videos/download",
    { url },
  );
  return data;
}

/**
 * Gets information about a video
 *
 * @param videoId - Video identifier
 * @returns Video metadata
 */
export async function getVideoInfo(
  videoId: string,
): Promise<VideoInfoResponse> {
  const { data } = await apiClient.get<VideoInfoResponse>(
    `/api/videos/${videoId}/info`,
  );
  return data;
}

/**
 * Merges video clips
 *
 * @param videoId - Source video identifier
 * @param mergeData - Clips and transition settings
 * @returns Merged video metadata
 */
export async function mergeClips(
  videoId: string,
  mergeData: MergeRequest,
): Promise<MergeResponse> {
  const { data } = await apiClient.post<MergeResponse>(
    `/api/videos/${videoId}/merge`,
    mergeData,
  );
  return data;
}

/**
 * Gets download URL for merged video
 *
 * @param videoId - Merged video identifier
 * @returns Download URL
 */
export function getVideoDownloadUrl(videoId: string): string {
  return `${API_URL}/api/videos/${videoId}/download`;
}

/**
 * Extracts error message from API error
 *
 * @param error - Axios error or unknown error
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "An error occurred"
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unknown error occurred";
}
