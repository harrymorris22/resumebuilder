import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGenerateCoverLetter } from './useGenerateCoverLetter'
import { useAppStore } from '../stores/useAppStore'

vi.mock('../services/anthropic', () => ({
  getClient: vi.fn(),
}))

import { getClient } from '../services/anthropic'

const mockGetClient = vi.mocked(getClient)

const stubResume = {
  id: 'r1',
  name: 'Test Resume',
  sections: [],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  templateId: 'classic' as const,
}

const stubJd = {
  id: 'jd1',
  title: 'Software Engineer',
  company: 'Acme',
  rawText: 'We need a React developer',
  keywords: ['react', 'typescript'],
  createdAt: '2024-01-01',
}

const stubContentPool = [
  {
    id: 'cp1',
    item: { type: 'bullet' as const, data: { text: 'Built stuff' }, context: { company: 'Co', title: 'Dev', startDate: '2020', endDate: '2024' } },
    source: 'user' as const,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
]

function setStoreState(overrides: Record<string, unknown> = {}) {
  useAppStore.setState({
    apiKey: 'test-key',
    generatedResumeId: 'r1',
    activeJobDescriptionId: 'jd1',
    resumes: [stubResume],
    jobDescriptions: [stubJd],
    contentPool: stubContentPool,
    addCoverLetter: vi.fn(),
    setActiveCoverLetter: vi.fn(),
    updateResume: vi.fn(),
    addContentBankItem: vi.fn(),
    ...overrides,
  } as never)
}

function makeMockStream(finalMsg: Record<string, unknown>) {
  return {
    finalMessage: vi.fn().mockResolvedValue(finalMsg),
  }
}

function makeToolUseMessage(toolName: string, input: Record<string, unknown>, toolId = 'tu1') {
  return {
    stop_reason: 'tool_use',
    content: [
      {
        type: 'tool_use',
        id: toolId,
        name: toolName,
        input,
      },
    ],
  }
}

function makeEndTurnMessage(text = 'Done') {
  return {
    stop_reason: 'end_turn',
    content: [{ type: 'text', text }],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  setStoreState()
})

describe('useGenerateCoverLetter', () => {
  it('returns error when no API key', async () => {
    setStoreState({ apiKey: '' })
    const { result } = renderHook(() => useGenerateCoverLetter())

    await act(() => result.current.generate())

    expect(result.current.error).toBe('No API key configured. Add your Anthropic API key in Settings.')
  })

  it('returns error when no resume (generatedResumeId does not match)', async () => {
    setStoreState({ generatedResumeId: 'nonexistent' })
    const { result } = renderHook(() => useGenerateCoverLetter())

    await act(() => result.current.generate())

    expect(result.current.error).toBe('No resume found. Generate a resume first.')
  })

  it('returns error when no active job description', async () => {
    setStoreState({ activeJobDescriptionId: null, jobDescriptions: [] })
    const { result } = renderHook(() => useGenerateCoverLetter())

    await act(() => result.current.generate())

    expect(result.current.error).toBe('No job description selected. Add a job description first.')
  })

  it('returns error when content pool is empty', async () => {
    setStoreState({ contentPool: [] })
    const { result } = renderHook(() => useGenerateCoverLetter())

    await act(() => result.current.generate())

    expect(result.current.error).toBe('Content pool is empty. Add content first.')
  })

  it('calls API with correct model and tools', async () => {
    const mockStream = makeMockStream(makeEndTurnMessage())
    const mockClient = { messages: { stream: vi.fn().mockReturnValue(mockStream) } }
    mockGetClient.mockReturnValue(mockClient as never)

    const { result } = renderHook(() => useGenerateCoverLetter())
    await act(() => result.current.generate())

    expect(mockClient.messages.stream).toHaveBeenCalledOnce()
    const callArgs = mockClient.messages.stream.mock.calls[0][0]
    expect(callArgs.model).toBe('claude-sonnet-4-5')
    expect(callArgs.tools).toBeDefined()
    expect(callArgs.max_tokens).toBe(4096)
  })

  it('processes generate_cover_letter tool call and saves cover letter', async () => {
    const addCoverLetter = vi.fn()
    const setActiveCoverLetter = vi.fn()
    setStoreState({ addCoverLetter, setActiveCoverLetter })

    const toolMsg = makeToolUseMessage('generate_cover_letter', {
      text: 'Dear Hiring Manager, I am excited...',
    })
    const endMsg = makeEndTurnMessage()

    const mockClient = {
      messages: {
        stream: vi.fn()
          .mockReturnValueOnce(makeMockStream(toolMsg))
          .mockReturnValueOnce(makeMockStream(endMsg)),
      },
    }
    mockGetClient.mockReturnValue(mockClient as never)

    const { result } = renderHook(() => useGenerateCoverLetter())
    await act(() => result.current.generate('conversational'))

    expect(addCoverLetter).toHaveBeenCalledOnce()
    const savedLetter = addCoverLetter.mock.calls[0][0]
    expect(savedLetter.text).toBe('Dear Hiring Manager, I am excited...')
    expect(savedLetter.tone).toBe('conversational')
    expect(savedLetter.resumeId).toBe('r1')
  })

  it('sets jobDescriptionId correctly on the cover letter', async () => {
    const addCoverLetter = vi.fn()
    setStoreState({ addCoverLetter })

    const toolMsg = makeToolUseMessage('generate_cover_letter', {
      text: 'Cover letter text here.',
    })
    const endMsg = makeEndTurnMessage()

    const mockClient = {
      messages: {
        stream: vi.fn()
          .mockReturnValueOnce(makeMockStream(toolMsg))
          .mockReturnValueOnce(makeMockStream(endMsg)),
      },
    }
    mockGetClient.mockReturnValue(mockClient as never)

    const { result } = renderHook(() => useGenerateCoverLetter())
    await act(() => result.current.generate())

    const savedLetter = addCoverLetter.mock.calls[0][0]
    expect(savedLetter.jobDescriptionId).toBe('jd1')
  })

  it('shows error when AI returns no tool call (loop exits without generating)', async () => {
    const endMsg = makeEndTurnMessage('Here is your cover letter...')
    const mockClient = {
      messages: { stream: vi.fn().mockReturnValue(makeMockStream(endMsg)) },
    }
    mockGetClient.mockReturnValue(mockClient as never)

    const { result } = renderHook(() => useGenerateCoverLetter())
    await act(() => result.current.generate())

    expect(result.current.error).toBe('AI could not generate a cover letter. Try again.')
  })

  it('shows error when AI returns empty text in cover letter', async () => {
    const addCoverLetter = vi.fn()
    setStoreState({ addCoverLetter })

    const toolMsg = makeToolUseMessage('generate_cover_letter', { text: '   ' })
    const endMsg = makeEndTurnMessage()

    const mockClient = {
      messages: {
        stream: vi.fn()
          .mockReturnValueOnce(makeMockStream(toolMsg))
          .mockReturnValueOnce(makeMockStream(endMsg)),
      },
    }
    mockGetClient.mockReturnValue(mockClient as never)

    const { result } = renderHook(() => useGenerateCoverLetter())
    await act(() => result.current.generate())

    // The empty text callback sets an error and skips setting generated=true,
    // so the post-loop check overwrites with the fallback error
    expect(result.current.error).toBe('AI could not generate a cover letter. Try again.')
    // Crucially, addCoverLetter should NOT have been called with empty text
    expect(addCoverLetter).not.toHaveBeenCalled()
  })

  it('handles API 401 error', async () => {
    mockGetClient.mockReturnValue({
      messages: {
        stream: vi.fn().mockImplementation(() => {
          throw new Error('Request failed with status code 401')
        }),
      },
    } as never)

    const { result } = renderHook(() => useGenerateCoverLetter())
    await act(() => result.current.generate())

    expect(result.current.error).toBe('Invalid API key. Check Settings.')
  })

  it('handles API 429 error', async () => {
    mockGetClient.mockReturnValue({
      messages: {
        stream: vi.fn().mockImplementation(() => {
          throw new Error('Request failed with status code 429')
        }),
      },
    } as never)

    const { result } = renderHook(() => useGenerateCoverLetter())
    await act(() => result.current.generate())

    expect(result.current.error).toBe('Rate limited. Wait a moment and try again.')
  })

  it('abort stops generation cleanly', async () => {
    let resolveStream: (v: unknown) => void
    const pendingStream = new Promise((resolve) => {
      resolveStream = resolve
    })

    const mockClient = {
      messages: {
        stream: vi.fn().mockReturnValue({
          finalMessage: vi.fn().mockReturnValue(pendingStream),
        }),
      },
    }
    mockGetClient.mockReturnValue(mockClient as never)

    const { result } = renderHook(() => useGenerateCoverLetter())

    // Start generation without awaiting
    let generatePromise: Promise<void>
    act(() => {
      generatePromise = result.current.generate()
    })

    // Abort mid-generation
    act(() => {
      result.current.abort()
    })

    // Resolve the pending stream so the promise can settle
    resolveStream!(makeEndTurnMessage())
    await act(() => generatePromise!)

    // Should not set an error because abort was triggered
    expect(result.current.error).toBeNull()
    expect(result.current.isGenerating).toBe(false)
  })
})
