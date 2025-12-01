'use client'

const STEP_NAMES = ['Company Details', 'Founders & Equity', 'Review & Deploy']

interface WizardStepsIndicatorProps {
  currentStep: number
  totalSteps: number
}

export function WizardStepsIndicator({
  currentStep,
  totalSteps,
}: WizardStepsIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex justify-between">
        {STEP_NAMES.map((stepName, index) => (
          <div
            key={stepName}
            className={`flex-1 text-center ${
              index <= currentStep ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {stepName}
          </div>
        ))}
      </div>
      <div className="bg-muted h-2 w-full rounded-full">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{
            width: `${((currentStep + 1) / totalSteps) * 100}%`,
          }}
        />
      </div>
    </div>
  )
}
