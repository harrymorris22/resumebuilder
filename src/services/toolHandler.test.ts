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
