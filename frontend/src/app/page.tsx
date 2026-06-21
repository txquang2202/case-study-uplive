"use client";

import { useState } from "react";
import { UrlInput, ClipList, TransitionSelector, AlertBox } from "@/components";
import { useVideoEditor } from "@/hooks/useVideoEditor";
import { getVideoDownloadUrl } from "@/lib/api";

/**
 * Main video editor page component
 */
export default function VideoEditor() {
  const { state, updateState, handleDownloadVideo, handleMergeClips } =
    useVideoEditor();

  const [clipStart, setClipStart] = useState<number>(0);
  const [clipEnd, setClipEnd] = useState<number>(0);

  /**
   * Validates and adds a new clip
   */
  const handleAddClip = () => {
    if (clipStart >= clipEnd) {
      updateState({ error: "Start time must be less than end time" });
      return;
    }
    if (clipEnd > state.duration) {
      updateState({
        error: `End time cannot exceed video duration (${state.duration}s)`,
      });
      return;
    }

    updateState({
      clips: [...state.clips, { start: clipStart, end: clipEnd }],
      error: null,
    });
    setClipStart(0);
    setClipEnd(0);
  };

  /**
   * Removes a clip by index
   */
  const handleRemoveClip = (index: number) => {
    updateState({
      clips: state.clips.filter((_, i) => i !== index),
    });
  };

  /**
   * Opens merged video download
   */
  const handleDownloadMerged = () => {
    if (!state.mergedVideoId) return;
    window.open(getVideoDownloadUrl(state.mergedVideoId), "_blank");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Video Editor Mini App
        </h1>
        <p className="text-gray-400 mb-8">
          Clip, arrange, and export YouTube video segments
        </p>

        {/* URL Input Section */}
        <UrlInput
          value={state.youtubeUrl}
          onChange={(url) => updateState({ youtubeUrl: url })}
          onSubmit={handleDownloadVideo}
          loading={state.loading}
          videoId={state.videoId}
          duration={state.duration}
        />

        {/* Clip Selection Section */}
        {state.videoId && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">
              2. Select Time Ranges
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Start (seconds)
                </label>
                <input
                  type="number"
                  value={clipStart}
                  onChange={(e) => setClipStart(Number(e.target.value))}
                  min="0"
                  max={state.duration}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Clip start time"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  End (seconds)
                </label>
                <input
                  type="number"
                  value={clipEnd}
                  onChange={(e) => setClipEnd(Number(e.target.value))}
                  min="0"
                  max={state.duration}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Clip end time"
                />
              </div>
            </div>

            <button
              onClick={handleAddClip}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors mb-4"
            >
              + Add Clip
            </button>

            <ClipList clips={state.clips} onRemoveClip={handleRemoveClip} />
          </div>
        )}

        {/* Transition Selection */}
        {state.clips.length > 0 && (
          <TransitionSelector
            value={state.transition}
            onChange={(transition) => updateState({ transition })}
          />
        )}

        {/* Merge Button */}
        {state.clips.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">4. Merge & Export</h2>
            <button
              onClick={handleMergeClips}
              disabled={state.loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 rounded-lg font-semibold text-lg transition-all"
              aria-busy={state.loading}
            >
              {state.loading ? "Merging..." : "Merge Clips"}
            </button>
          </div>
        )}

        {/* Download Merged Video */}
        {state.mergedVideoId && (
          <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-green-400">
              ✓ Export Ready
            </h2>
            <button
              onClick={handleDownloadMerged}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-lg transition-colors"
            >
              Download Merged Video
            </button>
          </div>
        )}

        {/* Status & Error Messages */}
        {state.status && <AlertBox type="info" message={state.status} />}

        {state.error && <AlertBox type="error" message={state.error} />}

        {/* Instructions */}
        <div className="bg-gray-800/50 rounded-lg p-6 mt-8 border border-gray-700/50">
          <h3 className="text-lg font-semibold mb-3">How to Use</h3>
          <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
            <li>Paste a YouTube URL and click Download</li>
            <li>Add one or more time ranges (clips) from the video</li>
            <li>Choose a transition effect (cut, fade, or slide)</li>
            <li>Click Merge Clips to process</li>
            <li>Download your edited video</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
