import { describe, it, expect, vi } from 'vitest'
import { handleToolCall } from './toolHandler'
import type { Resume } from '../types/resume'

const stubResume: Resume = {
  id: 'r1',
  name: 'Test',
  sections: [],
  createdAt: '',
  updatedAt: '',
}

function makeCtx(overrides = {}) {
  return {
    resume: stubResume,
    updateResume: vi.fn(),
    addContentBankItem: vi.fn(),
    ...overrides,
  }
}

describe('handleToolCall — analyze_job_description', () => {
  it('handles keywords as an array', () => {
    const onJobAnalyzed = vi.fn()
    const result = handleToolCall(
      'analyze_job_description',
      { title: 'SWE', company: 'Acme', keywords: ['react', 'ts'] },
      makeCtx({ onJobAnalyzed }),
    )

    expect(onJobAnalyzed).toHaveBeenCalledOnce()
    const job = onJobAnalyzed.mock.calls[0][0]
    expect(job.keywords).toEqual(['react', 'ts'])
    expect(result).toContain('react, ts')
  })

  it('handles keywords as a comma-separated string (regression)', () => {
    const onJobAnalyzed = vi.fn()
    const result = handleToolCall(
      'analyze_job_description',
      { title: 'SWE', company: 'Acme', keywords: 'react, typescript, node' },
      makeCtx({ onJobAnalyzed }),
    )

    const job = onJobAnalyzed.mock.calls[0][0]
    expect(job.keywords).toEqual(['react', 'typescript', 'node'])
    expect(result).toContain('react, typescript, node')
  })

  it('handles missing keywords', () => {
    const onJobAnalyzed = vi.fn()
    handleToolCall(
      'analyze_job_description',
      { title: 'SWE', company: 'Acme' },
      makeCtx({ onJobAnalyzed }),
    )

    const job = onJobAnalyzed.mock.calls[0][0]
    expect(job.keywords).toEqual([])
  })
})

describe('handleToolCall — generate_cover_letter', () => {
  it('uses jobDescriptionId from context when provided', () => {
    const onCoverLetterGenerated = vi.fn()
    handleToolCall(
      'generate_cover_letter',
      { text: 'Dear Hiring Manager...' },
      makeCtx({ onCoverLetterGenerated, jobDescriptionId: 'jd-42' }),
    )

    expect(onCoverLetterGenerated).toHaveBeenCalledOnce()
    const letter = onCoverLetterGenerated.mock.calls[0][0]
    expect(letter.jobDescriptionId).toBe('jd-42')
    expect(letter.text).toBe('Dear Hiring Manager...')
    expect(letter.resumeId).toBe('r1')
  })

  it('falls back to empty string when no jobDescriptionId in context', () => {
    const onCoverLetterGenerated = vi.fn()
    handleToolCall(
      'generate_cover_letter',
      { text: 'Cover letter body' },
      makeCtx({ onCoverLetterGenerated }),
    )

    const letter = onCoverLetterGenerated.mock.calls[0][0]
    expect(letter.jobDescriptionId).toBe('')
  })

  it('calls onCoverLetterGenerated callback with correct CoverLetter shape', () => {
    const onCoverLetterGenerated = vi.fn()
    const result = handleToolCall(
      'generate_cover_letter',
      { text: 'Full cover letter text here' },
      makeCtx({ onCoverLetterGenerated, jobDescriptionId: 'jd-99' }),
    )

    expect(result).toBe('Cover letter generated and saved.')
    const letter = onCoverLetterGenerated.mock.calls[0][0]
    expect(letter).toEqual(expect.objectContaining({
      resumeId: 'r1',
      jobDescriptionId: 'jd-99',
      text: 'Full cover letter text here',
    }))
    expect(letter.id).toBeDefined()
    expect(letter.createdAt).toBeDefined()
  })
})

describe('handleToolCall — suggest_actions mutation passthrough', () => {
  it('passes mutation data through to onActionSuggestion callback', () => {
    const onActionSuggestion = vi.fn()
    const mutation = { tool: 'update_experience_bullets', input: { experienceId: 'exp-1', bullets: ['New bullet'] } }

    handleToolCall(
      'suggest_actions',
      {
        suggestions: [{
          text: 'Add metrics',
          prompt: 'Update bullet',
          preview: 'New bullet',
          mutation,
          category: 'metrics',
          priority: 'high',
        }],
      },
      makeCtx({ onActionSuggestion }),
    )

    expect(onActionSuggestion).toHaveBeenCalledOnce()
    const suggestions = onActionSuggestion.mock.calls[0][0]
    expect(suggestions).toHaveLength(1)
    expect(suggestions[0].mutation).toEqual(mutation)
  })

  it('handles suggestions without mutation (backward compat)', () => {
    const onActionSuggestion = vi.fn()

    handleToolCall(
      'suggest_actions',
      {
        suggestions: [{
          text: 'Add metrics',
          prompt: 'Update bullet',
          category: 'metrics',
          priority: 'high',
        }],
      },
      makeCtx({ onActionSuggestion }),
    )

    const suggestions = onActionSuggestion.mock.calls[0][0]
    expect(suggestions[0].mutation).toBeUndefined()
  })
})
