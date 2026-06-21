import React from "react";

/**
 * Props for TransitionSelector component
 */
interface TransitionSelectorProps {
  value: "cut" | "fade" | "slide";
  onChange: (transition: "cut" | "fade" | "slide") => void;
}

const TRANSITIONS = ["cut", "fade", "slide"] as const;

/**
 * Component for selecting transition effect
 */
export function TransitionSelector({
  value,
  onChange,
}: TransitionSelectorProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
      <h2 className="text-xl font-semibold mb-4">3. Apply Transition</h2>
      <div className="flex gap-3">
        {TRANSITIONS.map((transition) => (
          <button
            key={transition}
            onClick={() => onChange(transition)}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              value === transition
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            aria-pressed={value === transition}
          >
            {transition.charAt(0).toUpperCase() + transition.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
