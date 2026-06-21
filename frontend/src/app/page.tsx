"use client";

import { useState } from "react";
import axios from "axios";

interface Clip {
  start: number;
  end: number;
}

export default function VideoEditor() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [clips, setClips] = useState<Clip[]>([]);
  const [transition, setTransition] = useState<"cut" | "fade" | "slide">("cut");
  const [mergedVideoId, setMergedVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  // Clip form state
  const [clipStart, setClipStart] = useState<number>(0);
  const [clipEnd, setClipEnd] = useState<number>(0);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const handleDownloadVideo = async () => {
    if (!youtubeUrl.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    setLoading(true);
    setError(null);
    setStatus("Downloading video...");

    try {
      const response = await axios.post(`${apiUrl}/api/videos/download`, {
        url: youtubeUrl,
      });
      setVideoId(response.data.id);
      setDuration(response.data.duration);
      setStatus(`Video downloaded! Duration: ${response.data.duration}s`);
      setClips([]);
      setMergedVideoId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download video");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClip = () => {
    if (clipStart >= clipEnd) {
      setError("Start time must be less than end time");
      return;
    }
    if (clipEnd > duration) {
      setError(`End time cannot exceed video duration (${duration}s)`);
      return;
    }

    setClips([...clips, { start: clipStart, end: clipEnd }]);
    setError(null);
    // Reset form
    setClipStart(0);
    setClipEnd(0);
  };

  const handleRemoveClip = (index: number) => {
    setClips(clips.filter((_, i) => i !== index));
  };

  const handleMergeClips = async () => {
    if (!videoId) {
      setError("Please download a video first");
      return;
    }
    if (clips.length === 0) {
      setError("Please add at least one clip");
      return;
    }

    setLoading(true);
    setError(null);
    setStatus("Merging clips...");

    try {
      const response = await axios.post(
        `${apiUrl}/api/videos/${videoId}/merge`,
        {
          clips,
          transition,
        },
      );
      setMergedVideoId(response.data.id);
      setStatus("Clips merged successfully! Ready to download.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to merge clips");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMerged = () => {
    if (!mergedVideoId) return;
    window.open(`${apiUrl}/api/videos/${mergedVideoId}/download`, "_blank");
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

        {/* YouTube URL Input */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">1. Input YouTube URL</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={handleDownloadVideo}
              disabled={loading || !youtubeUrl.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              {loading ? "Downloading..." : "Download"}
            </button>
          </div>
          {videoId && (
            <p className="mt-2 text-green-400 text-sm">
              ✓ Video ID: {videoId} | Duration: {duration}s
            </p>
          )}
        </div>

        {/* Clip Selection */}
        {videoId && (
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
                  max={duration}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  max={duration}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleAddClip}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors mb-4"
            >
              + Add Clip
            </button>

            {/* Clips List */}
            {clips.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">
                  Selected Clips ({clips.length})
                </h3>
                <div className="space-y-2">
                  {clips.map((clip, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-700 p-3 rounded-lg"
                    >
                      <span className="text-sm">
                        Clip {index + 1}: {clip.start}s → {clip.end}s (
                        {clip.end - clip.start}s)
                      </span>
                      <button
                        onClick={() => handleRemoveClip(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transition Selection */}
        {clips.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">3. Apply Transition</h2>
            <div className="flex gap-3">
              {["cut", "fade", "slide"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTransition(t as "cut" | "fade" | "slide")}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    transition === t
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Merge Button */}
        {clips.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">4. Merge & Export</h2>
            <button
              onClick={handleMergeClips}
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 rounded-lg font-semibold text-lg transition-all"
            >
              {loading ? "Merging..." : "Merge Clips"}
            </button>
          </div>
        )}

        {/* Download Merged Video */}
        {mergedVideoId && (
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
        {status && (
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 mb-4">
            <p className="text-blue-300">{status}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-4">
            <p className="text-red-300">⚠ {error}</p>
          </div>
        )}

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
