import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResumeLibrary } from './ResumeLibrary'

let mockState: Record<string, unknown>

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) => selector(mockState)),
}))

vi.mock('../../utils/resumeDefaults', () => ({
  createDefaultResume: () => ({
    id: 'new-resume-id',
    name: 'Untitled Resume',
    templateId: 'classic',
    sections: [],
    createdAt: '2026-03-31',
    updatedAt: '2026-03-31',
  }),
}))

const setActiveResumeId = vi.fn()
const setGeneratedResumeId = vi.fn()
const setActiveJobDescriptionId = vi.fn()
const setWizardStep = vi.fn()
const removeResume = vi.fn()
const renameResume = vi.fn()
const addResume = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockState = {
    resumes: [
      { id: 'r1', name: 'My Resume', templateId: 'classic', updatedAt: '2026-03-31', targetJobId: 'jd1' },
      { id: 'r2', name: 'General CV', templateId: 'modern', updatedAt: '2026-03-30' },
    ],
    jobDescriptions: [
      { id: 'jd1', title: 'SWE', company: 'Google', keywords: ['react'] },
    ],
    setActiveResumeId,
    setGeneratedResumeId,
    setActiveJobDescriptionId,
    setWizardStep,
    removeResume,
    renameResume,
    addResume,
  }
})

describe('ResumeLibrary', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<ResumeLibrary open={false} onClose={vi.fn()} />)
    expect(container.innerHTML).toBe('')
  })

  it('shows resumes grouped by job', () => {
    render(<ResumeLibrary open={true} onClose={vi.fn()} />)
    expect(screen.getByText('My Resume')).toBeInTheDocument()
    expect(screen.getByText('General CV')).toBeInTheDocument()
    expect(screen.getByText('SWE at Google')).toBeInTheDocument()
    expect(screen.getByText('General')).toBeInTheDocument()
  })

  it('shows Create New Resume button', () => {
    render(<ResumeLibrary open={true} onClose={vi.fn()} />)
    expect(screen.getByText('Create New Resume')).toBeInTheDocument()
  })

  it('creates a new resume and navigates to content-pool', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ResumeLibrary open={true} onClose={onClose} />)
    await user.click(screen.getByText('Create New Resume'))
    expect(addResume).toHaveBeenCalledWith(expect.objectContaining({ id: 'new-resume-id' }))
    expect(setActiveResumeId).toHaveBeenCalledWith('new-resume-id')
    expect(setWizardStep).toHaveBeenCalledWith('content-pool')
    expect(onClose).toHaveBeenCalled()
  })

  it('selects a resume and navigates to refine', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ResumeLibrary open={true} onClose={onClose} />)
    await user.click(screen.getByText('My Resume'))
    expect(setActiveResumeId).toHaveBeenCalledWith('r1')
    expect(setGeneratedResumeId).toHaveBeenCalledWith('r1')
    expect(setActiveJobDescriptionId).toHaveBeenCalledWith('jd1')
    expect(setWizardStep).toHaveBeenCalledWith('refine')
    expect(onClose).toHaveBeenCalled()
  })

  it('shows rename input on pencil click', async () => {
    const user = userEvent.setup()
    render(<ResumeLibrary open={true} onClose={vi.fn()} />)
    const renameButtons = screen.getAllByTitle('Rename')
    await user.click(renameButtons[0])
    expect(screen.getByDisplayValue('My Resume')).toBeInTheDocument()
  })

  it('renames a resume on blur', async () => {
    const user = userEvent.setup()
    render(<ResumeLibrary open={true} onClose={vi.fn()} />)
    const renameButtons = screen.getAllByTitle('Rename')
    await user.click(renameButtons[0])
    const input = screen.getByDisplayValue('My Resume')
    await user.clear(input)
    await user.type(input, 'Renamed CV')
    await user.tab() // blur
    expect(renameResume).toHaveBeenCalledWith('r1', 'Renamed CV')
  })

  it('shows empty state when no resumes', () => {
    mockState.resumes = []
    render(<ResumeLibrary open={true} onClose={vi.fn()} />)
    expect(screen.getByText(/No resumes yet/)).toBeInTheDocument()
  })

  it('shows resume count in footer', () => {
    render(<ResumeLibrary open={true} onClose={vi.fn()} />)
    expect(screen.getByText('2 resumes')).toBeInTheDocument()
  })
})
