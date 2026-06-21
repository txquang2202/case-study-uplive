import React from "react";
import { Clip } from "@/lib/api";

/**
 * Props for ClipList component
 */
interface ClipListProps {
  clips: Clip[];
  onRemoveClip: (index: number) => void;
}

/**
 * Component for displaying list of selected clips
 */
export function ClipList({ clips, onRemoveClip }: ClipListProps) {
  if (clips.length === 0) {
    return null;
  }

  return (
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
              onClick={() => onRemoveClip(index)}
              className="text-red-400 hover:text-red-300 text-sm"
              aria-label={`Remove clip ${index + 1}`}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
