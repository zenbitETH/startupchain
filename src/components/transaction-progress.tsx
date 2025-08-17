import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { TransactionStatus, TransactionStep } from '@/hooks/use-startup-chain'

const ProgressOverlay = styled.div<{ $isVisible: boolean }>`
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  min-width: 350px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  transform: translateX(${props => props.$isVisible ? '0' : '400px'});
  opacity: ${props => props.$isVisible ? '1' : '0'};
  transition: all 0.3s ease-in-out;
  color: white;
`

const Title = styled.h3`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
`

const StepContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Step = styled.div<{ $isActive: boolean; $isComplete: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: ${props => props.$isComplete ? 0.7 : props.$isActive ? 1 : 0.5};
  transition: all 0.3s ease;
`

const StepIcon = styled.div<{ $isActive: boolean; $isComplete: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid white;
  background: ${props => props.$isComplete ? 'white' : props.$isActive ? 'rgba(255,255,255,0.3)' : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  ${props => props.$isActive && `
    &::after {
      content: '';
      position: absolute;
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }
  `}

  ${props => props.$isComplete && `
    &::after {
      content: '✓';
      color: #667eea;
      font-weight: bold;
      font-size: 14px;
    }
  `}

  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0.5; }
    100% { transform: scale(1); opacity: 1; }
  }
`

const StepText = styled.div`
  flex: 1;
`

const StepLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
`

const StepDescription = styled.div`
  font-size: 12px;
  opacity: 0.9;
  margin-top: 2px;
`

const CurrentAction = styled.div`
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
`

interface TransactionProgressProps {
  status: TransactionStatus
  companyName?: string
  numberOfShares?: number
  foundersCount?: number
}

const steps: Array<{ key: TransactionStep; label: string; description: string }> = [
  { key: 'registering-company', label: 'Register Company', description: 'Creating your company on blockchain' },
  { key: 'setting-shares', label: 'Set Share Structure', description: 'Configuring total shares' },
  { key: 'adding-founders', label: 'Add Founders', description: 'Recording founder information' },
  { key: 'setting-ownership', label: 'Set Ownership', description: 'Finalizing equity distribution' },
]

export function TransactionProgress({ status, companyName, numberOfShares, foundersCount }: TransactionProgressProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    console.log('TransactionProgress status update:', status)
    const shouldShow = status.step !== 'idle' && status.step !== 'complete'
    console.log('Should show progress:', shouldShow)
    setIsVisible(shouldShow)
    
    if (status.step === 'complete') {
      setTimeout(() => setIsVisible(false), 3000)
    }
  }, [status.step])

  const getStepStatus = (stepKey: TransactionStep) => {
    const currentIndex = steps.findIndex(s => s.key === status.step)
    const stepIndex = steps.findIndex(s => s.key === stepKey)
    
    return {
      isActive: status.step === stepKey,
      isComplete: currentIndex > stepIndex
    }
  }

  const getStepDescription = (step: typeof steps[0]) => {
    switch (step.key) {
      case 'registering-company':
        return companyName ? `Creating "${companyName}"` : step.description
      case 'setting-shares':
        return numberOfShares ? `${numberOfShares.toLocaleString()} total shares` : step.description
      case 'adding-founders':
        return foundersCount ? `Adding ${foundersCount} founder${foundersCount > 1 ? 's' : ''}` : step.description
      default:
        return step.description
    }
  }

  return (
    <ProgressOverlay $isVisible={isVisible}>
      <Title>🚀 Setting Up Your Company</Title>
      
      <StepContainer>
        {steps.map(step => {
          const { isActive, isComplete } = getStepStatus(step.key)
          return (
            <Step key={step.key} $isActive={isActive} $isComplete={isComplete}>
              <StepIcon $isActive={isActive} $isComplete={isComplete} />
              <StepText>
                <StepLabel>{step.label}</StepLabel>
                <StepDescription>{getStepDescription(step)}</StepDescription>
              </StepText>
            </Step>
          )
        })}
      </StepContainer>

      {status.message && status.step !== 'idle' && (
        <CurrentAction>
          <strong>Current Transaction:</strong><br />
          {status.message}
          {status.currentFounder && (
            <div style={{ marginTop: '4px', opacity: 0.9 }}>
              Processing: {status.currentFounder}
            </div>
          )}
        </CurrentAction>
      )}
    </ProgressOverlay>
  )
}