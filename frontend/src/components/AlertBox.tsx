import React from "react";

/**
 * Props for AlertBox component
 */
interface AlertBoxProps {
  type: "success" | "error" | "info";
  message: string;
}

/**
 * Component for displaying alert messages
 */
export function AlertBox({ type, message }: AlertBoxProps) {
  const styles = {
    success: "bg-green-900/30 border-green-500/50",
    error: "bg-red-900/30 border-red-500/50",
    info: "bg-blue-900/30 border-blue-500/50",
  };

  const textColor = {
    success: "text-green-300",
    error: "text-red-300",
    info: "text-blue-300",
  };

  const icon = {
    success: "✓",
    error: "⚠",
    info: "ℹ",
  };

  return (
    <div className={`${styles[type]} border rounded-lg p-4 mb-4`}>
      <p className={textColor[type]}>
        {icon[type]} {message}
      </p>
    </div>
  );
}
