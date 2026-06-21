import { useState, useCallback } from "react";
import { Clip, getErrorMessage, downloadVideo, mergeClips } from "@/lib/api";

/**
 * State for video editor operations
 */
export interface VideoEditorState {
  youtubeUrl: string;
  videoId: string | null;
  duration: number;
  clips: Clip[];
  transition: "cut" | "fade" | "slide";
  mergedVideoId: string | null;
  loading: boolean;
  error: string | null;
  status: string;
}

/**
 * Custom hook for managing video editor state and operations
 *
 * @returns State and handler functions
 */
export function useVideoEditor() {
  const [state, setState] = useState<VideoEditorState>({
    youtubeUrl: "",
    videoId: null,
    duration: 0,
    clips: [],
    transition: "cut",
    mergedVideoId: null,
    loading: false,
    error: null,
    status: "",
  });

  /**
   * Updates state with partial changes
   */
  const updateState = useCallback((updates: Partial<VideoEditorState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Handles video download
   */
  const handleDownloadVideo = useCallback(async () => {
    if (!state.youtubeUrl.trim()) {
      updateState({ error: "Please enter a YouTube URL" });
      return;
    }

    updateState({ loading: true, error: null, status: "Downloading video..." });

    try {
      const result = await downloadVideo(state.youtubeUrl);
      updateState({
        videoId: result.id,
        duration: result.duration,
        status: `Video downloaded! Duration: ${result.duration}s`,
        clips: [],
        mergedVideoId: null,
        loading: false,
      });
    } catch (error) {
      updateState({
        error: getErrorMessage(error),
        status: "",
        loading: false,
      });
    }
  }, [state.youtubeUrl, updateState]);

  /**
   * Handles clip merge operation
   */
  const handleMergeClips = useCallback(async () => {
    if (!state.videoId) {
      updateState({ error: "Please download a video first" });
      return;
    }
    if (state.clips.length === 0) {
      updateState({ error: "Please add at least one clip" });
      return;
    }

    updateState({ loading: true, error: null, status: "Merging clips..." });

    try {
      const result = await mergeClips(state.videoId, {
        clips: state.clips,
        transition: state.transition,
      });
      updateState({
        mergedVideoId: result.id,
        status: "Clips merged successfully! Ready to download.",
        loading: false,
      });
    } catch (error) {
      updateState({
        error: getErrorMessage(error),
        status: "",
        loading: false,
      });
    }
  }, [state.videoId, state.clips, state.transition, updateState]);

  return {
    state,
    updateState,
    handleDownloadVideo,
    handleMergeClips,
  };
}
