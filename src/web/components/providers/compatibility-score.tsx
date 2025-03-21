import * as React from "react";
import { InfoIcon } from "lucide-react"; // 0.284.0
import { cn } from "../../lib/utils/color";
import { Progress } from "../ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { MatchFactor } from "../../types/provider";

/**
 * Determines the appropriate color class based on compatibility score value
 * @param score - Compatibility score (0-1)
 * @returns Tailwind CSS color class
 */
function getScoreColor(score: number): string {
  if (score < 0.5) return "text-red-500";
  if (score < 0.7) return "text-amber-500";
  if (score < 0.85) return "text-blue-500";
  return "text-green-500";
}

/**
 * Formats the compatibility score as a percentage
 * @param score - Compatibility score (0-1)
 * @returns Formatted score percentage
 */
function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

/**
 * A component that visualizes the AI-generated compatibility score between a client and provider
 */
export const CompatibilityScore: React.FC<{
  /** Compatibility score between 0 and 1 */
  score: number;
  /** Match factors that contribute to the compatibility score */
  factors?: MatchFactor[];
  /** Size of the compatibility score visualization (sm, md, lg) */
  size?: "sm" | "md" | "lg";
  /** Whether to show detailed match factors */
  showDetails?: boolean;
  /** Additional CSS classes */
  className?: string;
}> = ({
  score,
  factors,
  size = "md",
  showDetails = true,
  className,
}) => {
  // Determine size classes based on the size prop
  const sizeClasses = {
    sm: {
      container: "text-sm",
      circle: "w-16 h-16",
      score: "text-base font-bold",
      label: "text-xs",
      infoIcon: "h-3.5 w-3.5",
      tooltipWidth: "w-60",
      strokeWidth: "6",
    },
    md: {
      container: "text-base",
      circle: "w-24 h-24",
      score: "text-xl font-bold",
      label: "text-sm",
      infoIcon: "h-4 w-4",
      tooltipWidth: "w-64",
      strokeWidth: "8",
    },
    lg: {
      container: "text-lg",
      circle: "w-32 h-32",
      score: "text-2xl font-bold",
      label: "text-base",
      infoIcon: "h-5 w-5",
      tooltipWidth: "w-72",
      strokeWidth: "10",
    },
  }[size];

  // Get color class based on score
  const colorClass = getScoreColor(score);
  
  // Format score as percentage
  const formattedScore = formatScore(score);

  // Convert compatibility score to a value between 0-1
  const normalizedScore = Math.max(0, Math.min(1, score));
  
  // Calculate the circumference of the circle
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate the stroke-dashoffset based on the score
  const dashOffset = circumference * (1 - normalizedScore);

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center", 
        sizeClasses.container,
        className
      )}
    >
      {/* Circular progress indicator */}
      <div className="relative" aria-label={`Compatibility score: ${formattedScore}`}>
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 100 100" 
          className={sizeClasses.circle}
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth={sizeClasses.strokeWidth}
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth={sizeClasses.strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 50 50)"
            className={cn(
              "transition-all duration-700 ease-in-out",
              score < 0.5 ? "text-red-500" : 
              score < 0.7 ? "text-amber-500" : 
              score < 0.85 ? "text-blue-500" : 
              "text-green-500"
            )}
          />
        </svg>
        
        {/* Score text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(sizeClasses.score, colorClass)}>
            {formattedScore}
          </span>
          <span className="text-gray-600 dark:text-gray-300 text-xs">
            Match
          </span>
        </div>
      </div>

      {/* Match details with tooltip */}
      {showDetails && factors && factors.length > 0 && (
        <div className="mt-2 flex items-center justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs"
                  aria-label="View compatibility factors"
                >
                  <InfoIcon className={sizeClasses.infoIcon} />
                  <span>Match details</span>
                </button>
              </TooltipTrigger>
              <TooltipContent 
                className={cn(
                  "p-0 bg-white dark:bg-gray-800",
                  sizeClasses.tooltipWidth
                )}
                sideOffset={10}
              >
                <div className="p-4">
                  <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
                    Compatibility Factors
                  </h3>
                  <ul className="space-y-3">
                    {factors.map((factor, index) => (
                      <li key={index} className="text-xs">
                        <div className="flex justify-between font-medium text-gray-800 dark:text-gray-200">
                          <span>{factor.name}</span>
                          <span className={getScoreColor(factor.score)}>
                            {Math.round(factor.score * 100)}%
                          </span>
                        </div>
                        <Progress 
                          value={factor.score * 100} 
                          className="h-1 w-full mt-1"
                          color={factor.score < 0.5 ? "error" : 
                                factor.score < 0.7 ? "warning" : 
                                factor.score < 0.85 ? "primary" : 
                                "success"}
                          aria-hidden="true"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {factor.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
};

export default CompatibilityScore;