import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContentPoolPage } from './ContentPoolPage'
import type { ContentPoolEntry } from '../../types/resume'

const makeBullet = (overrides: Partial<ContentPoolEntry> = {}): ContentPoolEntry => ({
  id: 'entry-1',
  item: {
    type: 'bullet',
    data: { text: 'Did something great' },
    context: { company: 'Acme', title: 'Engineer', location: '', startDate: 'Jan 2020', endDate: 'Dec 2022' },
  },
  source: 'user',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

const makeCurrentBullet = (): ContentPoolEntry => ({
  id: 'entry-2',
  item: {
    type: 'bullet',
    data: { text: 'Leading the team' },
    context: { company: 'Startup', title: 'Lead', location: '', startDate: 'Mar 2024', endDate: null },
  },
  source: 'user',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
})

const updatePoolEntry = vi.fn()
const addPoolEntry = vi.fn()
const removePoolEntry = vi.fn()
const reorderPoolEntries = vi.fn()
const addPoolItemToResume = vi.fn()
const removePoolItemFromResume = vi.fn()
const updateResume = vi.fn()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockState: any

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) => selector(mockState)),
}))

// DnD kit needs pointer events
vi.mock('./ContactInfoForm', () => ({
  ContactInfoForm: () => <div data-testid="contact-info-form">ContactInfoForm</div>,
}))

vi.mock('@dnd-kit/core', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@dnd-kit/core')>()
  return {
    ...mod,
    DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useSensor: vi.fn(() => ({})),
    useSensors: vi.fn(() => []),
  }
})

vi.mock('@dnd-kit/sortable', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@dnd-kit/sortable')>()
  return {
    ...mod,
    SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useSortable: vi.fn(() => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: false,
    })),
  }
})

beforeEach(() => {
  vi.clearAllMocks()
  mockState = {
    contentPool: [],
    resumes: [],
    activeResumeId: null,
    apiKey: null,
    updatePoolEntry,
    addPoolEntry,
    removePoolEntry,
    reorderPoolEntries,
    addPoolItemToResume,
    removePoolItemFromResume,
    updateResume,
  }
})

describe('ContentPoolPage — editable job headers', () => {
  it('renders job title and company as clickable fields', () => {
    mockState.contentPool = [makeBullet()]
    render(<ContentPoolPage />)
    expect(screen.getByText('Engineer')).toBeInTheDocument()
    expect(screen.getByText('Acme')).toBeInTheDocument()
  })

  it('shows "Present" for null endDate', () => {
    mockState.contentPool = [makeCurrentBullet()]
    render(<ContentPoolPage />)
    expect(screen.getByText('Present')).toBeInTheDocument()
  })

  it('shows actual endDate when not null', () => {
    mockState.contentPool = [makeBullet()]
    render(<ContentPoolPage />)
    expect(screen.getByText('Dec 2022')).toBeInTheDocument()
  })

  it('calls updatePoolEntry for all entries when title is saved', async () => {
    const user = userEvent.setup()
    const entry1 = makeBullet({ id: 'e1' })
    const entry2: ContentPoolEntry = {
      ...makeBullet({ id: 'e2' }),
      item: {
        type: 'bullet',
        data: { text: 'Second bullet' },
        context: { company: 'Acme', title: 'Engineer', location: '', startDate: 'Jan 2020', endDate: 'Dec 2022' },
      },
    }
    mockState.contentPool = [entry1, entry2]
    render(<ContentPoolPage />)

    // Click on the title to open edit mode
    const titleEl = screen.getByText('Engineer')
    await user.click(titleEl)

    // Find the textarea (edit mode activated)
    const textarea = screen.getByRole('textbox')
    await user.clear(textarea)
    await user.type(textarea, 'Senior Engineer')
    await user.keyboard('{Enter}')

    // updatePoolEntry should have been called twice (one per entry)
    expect(updatePoolEntry).toHaveBeenCalledTimes(2)
    expect(updatePoolEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'e1',
        item: expect.objectContaining({
          context: expect.objectContaining({ title: 'Senior Engineer' }),
        }),
      })
    )
    expect(updatePoolEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'e2',
        item: expect.objectContaining({
          context: expect.objectContaining({ title: 'Senior Engineer' }),
        }),
      })
    )
  })

  it('stores null when user types "Present" for endDate', async () => {
    const user = userEvent.setup()
    mockState.contentPool = [makeBullet()]
    render(<ContentPoolPage />)

    const endDateEl = screen.getByText('Dec 2022')
    await user.click(endDateEl)

    const textarea = screen.getByRole('textbox')
    await user.clear(textarea)
    await user.type(textarea, 'Present')
    await user.keyboard('{Enter}')

    expect(updatePoolEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        item: expect.objectContaining({
          context: expect.objectContaining({ endDate: null }),
        }),
      })
    )
  })

  it('does not call updatePoolEntry when title is cleared (empty guard)', async () => {
    const user = userEvent.setup()
    mockState.contentPool = [makeBullet()]
    render(<ContentPoolPage />)

    const titleEl = screen.getByText('Engineer')
    await user.click(titleEl)

    const textarea = screen.getByRole('textbox')
    await user.clear(textarea)
    await user.keyboard('{Enter}')

    expect(updatePoolEntry).not.toHaveBeenCalled()
  })
})

// Generate Recommendations tests removed — functionality moved to wizard Step 2 (RecommendationsStep)
