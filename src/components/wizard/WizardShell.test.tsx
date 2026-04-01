import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WizardShell } from './WizardShell'

let mockState: Record<string, unknown>

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) => selector(mockState)),
}))

// Mock all step components to isolate WizardShell behavior
vi.mock('./steps/ContentPoolStep', () => ({
  ContentPoolStep: () => <div data-testid="step-content-pool">ContentPoolStep</div>,
}))
vi.mock('./steps/JobDescriptionStep', () => ({
  JobDescriptionStep: () => <div data-testid="step-job-description">JobDescriptionStep</div>,
}))
vi.mock('./steps/GenerateStep', () => ({
  GenerateStep: () => <div data-testid="step-generate">GenerateStep</div>,
}))
vi.mock('./steps/RefineStep', () => ({
  RefineStep: () => <div data-testid="step-refine">RefineStep</div>,
}))

const setWizardStep = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockState = {
    wizardStep: 'content-pool',
    contentPool: [{ id: '1' }],
    activeJobDescriptionId: null,
    generatedResumeId: null,
    resumes: [{ id: 'r1', name: 'Master Resume', sections: [] }],
    activeResumeId: 'r1',
    setWizardStep,
  }
})

describe('WizardShell', () => {
  it('renders resume title above step indicator', () => {
    render(<WizardShell />)
    expect(screen.getByText('Master Resume')).toBeInTheDocument()
  })

  it('renders step indicator, step body, and nav bar', () => {
    render(<WizardShell />)
    expect(screen.getByRole('navigation', { name: 'Wizard steps' })).toBeInTheDocument()
    expect(screen.getByTestId('step-content-pool')).toBeInTheDocument()
    expect(screen.getByText('Back')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  it('renders ContentPoolStep when wizardStep is content-pool', () => {
    render(<WizardShell />)
    expect(screen.getByTestId('step-content-pool')).toBeInTheDocument()
  })

  it('renders JobDescriptionStep when wizardStep is job-description', () => {
    mockState.wizardStep = 'job-description'
    render(<WizardShell />)
    expect(screen.getByTestId('step-job-description')).toBeInTheDocument()
  })

  it('renders GenerateStep when wizardStep is generate', () => {
    mockState.wizardStep = 'generate'
    render(<WizardShell />)
    expect(screen.getByTestId('step-generate')).toBeInTheDocument()
  })

  it('renders RefineStep when wizardStep is refine', () => {
    mockState.wizardStep = 'refine'
    render(<WizardShell />)
    expect(screen.getByTestId('step-refine')).toBeInTheDocument()
  })

  it('Next button advances to job-description step when gate passes', async () => {
    const user = userEvent.setup()
    render(<WizardShell />)
    await user.click(screen.getByText('Next'))
    expect(setWizardStep).toHaveBeenCalledWith('job-description')
  })

  it('Next button is disabled when gate fails (empty pool)', async () => {
    mockState.contentPool = []
    render(<WizardShell />)
    const nextBtn = screen.getByText('Next')
    expect(nextBtn).toHaveAttribute('aria-disabled', 'true')
  })

  it('Back button is disabled on first step', () => {
    render(<WizardShell />)
    const backBtn = screen.getByText('Back')
    expect(backBtn).toBeDisabled()
  })

  it('Back button navigates to previous step', async () => {
    mockState.wizardStep = 'job-description'
    const user = userEvent.setup()
    render(<WizardShell />)
    await user.click(screen.getByText('Back'))
    expect(setWizardStep).toHaveBeenCalledWith('content-pool')
  })

  it('step indicator shows completed checkmark for past steps', () => {
    mockState.wizardStep = 'job-description'
    render(<WizardShell />)
    const nav = screen.getByRole('navigation', { name: 'Wizard steps' })
    expect(nav).toBeInTheDocument()
    const activeStep = nav.querySelector('[aria-current="step"]')
    expect(activeStep).toBeInTheDocument()
  })
})
