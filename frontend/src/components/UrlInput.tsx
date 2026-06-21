import React from "react";

/**
 * Props for UrlInput component
 */
interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  videoId: string | null;
  duration: number;
}

/**
 * Component for YouTube URL input and download
 */
export function UrlInput({
  value,
  onChange,
  onSubmit,
  loading,
  videoId,
  duration,
}: UrlInputProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
      <h2 className="text-xl font-semibold mb-4">1. Input YouTube URL</h2>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
          aria-label="YouTube URL input"
        />
        <button
          onClick={onSubmit}
          disabled={loading || !value.trim()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
          aria-busy={loading}
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
  );
}
