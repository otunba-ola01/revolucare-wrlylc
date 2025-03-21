import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { ConfidenceScore } from "./confidence-score";
import { CarePlanOption } from "../../types/care-plan";
import { cn } from "../../lib/utils/color";
import { CheckCircle2 } from "lucide-react";

/**
 * Props for the PlanOptions component
 */
interface PlanOptionsProps {
  /**
   * Array of AI-generated care plan options to display
   */
  options: CarePlanOption[];
  /**
   * Currently selected care plan option, if any
   */
  selectedOption: CarePlanOption | null;
  /**
   * Callback function called when an option is selected
   */
  onSelectOption: (option: CarePlanOption) => void;
  /**
   * Optional CSS class name for styling
   */
  className?: string;
}

/**
 * Component that displays AI-generated care plan options for selection
 */
export const PlanOptions: React.FC<PlanOptionsProps> = ({
  options,
  selectedOption,
  onSelectOption,
  className,
}) => {
  // Sort options by confidence score in descending order
  const sortedOptions = [...options].sort(
    (a, b) => b.confidenceScore - a.confidenceScore
  );

  if (sortedOptions.length === 0) {
    return (
      <div className={cn("p-8 text-center border rounded-lg", className)}>
        <h3 className="text-lg font-semibold mb-2">No Care Plan Options Available</h3>
        <p className="text-gray-600 dark:text-gray-400">
          No AI-generated care plan options are available at this time. Please try again later or create a custom plan.
        </p>
      </div>
    );
  }

  return (
    <div 
      className={cn("space-y-6", className)}
      role="radiogroup"
      aria-label="Care Plan Options"
    >
      {sortedOptions.map((option, index) => {
        const isSelected = selectedOption?.title === option.title;
        const isRecommended = index === 0; // First option after sorting is recommended
        const optionId = `care-plan-option-${index}`;
        
        return (
          <Card
            key={`${option.title}-${index}`}
            className={cn(
              "transition-all hover:shadow-md",
              isSelected
                ? "border-2 border-indigo-600 shadow-md"
                : "border border-gray-200"
            )}
          >
            <CardHeader className="relative">
              {isSelected && (
                <div className="absolute top-4 right-4 text-indigo-600">
                  <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                </div>
              )}
              
              <CardTitle className="text-lg font-semibold" id={optionId}>
                {option.title}
                {isRecommended && !isSelected && (
                  <span className="ml-2 text-sm text-indigo-600 font-normal">(Recommended)</span>
                )}
              </CardTitle>
              
              <ConfidenceScore 
                score={option.confidenceScore} 
                className="mt-2" 
              />
            </CardHeader>
            
            <CardContent className="space-y-4">
              {option.description && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {option.description}
                </p>
              )}
              
              <div>
                <h4 className="text-sm font-semibold mb-2">Goals:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {option.goals.map((goal, goalIndex) => (
                    <li key={goalIndex} className="text-sm text-gray-700 dark:text-gray-300">
                      {goal.description}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold mb-2">Interventions:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {option.interventions.map((intervention, interventionIndex) => (
                    <li key={interventionIndex} className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{intervention.description}</span>{" "}
                      <span className="text-gray-500">
                        ({intervention.frequency} for {intervention.duration}{intervention.responsibleParty ? `, ${intervention.responsibleParty}` : ""})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold mb-2">Expected Outcomes:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {option.expectedOutcomes.map((outcome, outcomeIndex) => (
                    <li key={outcomeIndex} className="text-sm text-gray-700 dark:text-gray-300">
                      {outcome}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button
                onClick={() => onSelectOption(option)}
                variant={isSelected ? "secondary" : "primary"}
                className="w-full sm:w-auto"
                aria-pressed={isSelected}
                aria-labelledby={optionId}
              >
                {isSelected ? "Selected" : "Select This Plan"}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};