import React from "react";
import { Progress } from "../ui/progress";
import { cn } from "../../lib/utils/color";

/**
 * Determines the appropriate color class based on confidence score value
 */
function getScoreColor(score: number): string {
  if (score < 50) return "text-red-500";
  if (score < 70) return "text-amber-500";
  if (score < 90) return "text-blue-500";
  return "text-green-500";
}

interface ConfidenceScoreProps {
  /**
   * The confidence score value (0-100)
   */
  score: number;
  /**
   * Optional CSS class name for styling
   */
  className?: string;
}

/**
 * A component that displays the AI confidence score for care plan options
 */
export const ConfidenceScore: React.FC<ConfidenceScoreProps> = ({ 
  score, 
  className 
}) => {
  // Determine the appropriate color based on the score value
  const colorClass = getScoreColor(score);
  
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          AI Confidence Score
        </span>
        <span 
          className={cn("text-sm font-bold", colorClass)} 
          aria-live="polite"
        >
          {score}%
        </span>
      </div>
      <Progress 
        value={score} 
        color={
          score < 50 ? "error" : 
          score < 70 ? "warning" : 
          score < 90 ? "primary" : 
          "success"
        }
        aria-label={`AI confidence score: ${score} percent`}
      />
    </div>
  );
};