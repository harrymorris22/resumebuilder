import { describe, it, expect } from 'vitest'
import { extractText } from './resumeParser'

describe('extractText', () => {
  it('extracts text from plain text files', async () => {
    const content = 'John Doe\nSoftware Engineer\nExperience: 5 years'
    const file = new File([content], 'resume.txt', { type: 'text/plain' })
    const result = await extractText(file)
    expect(result).toBe(content)
  })

  it('returns text content for files with no type but .txt extension', async () => {
    const content = 'Plain text resume'
    const file = new File([content], 'resume.txt', { type: '' })
    const result = await extractText(file)
    expect(result).toBe(content)
  })
})
