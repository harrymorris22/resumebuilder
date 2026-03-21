import { describe, it, expect, vi } from 'vitest'
import { extractText, parseResumeWithClaude } from './resumeParser'

vi.mock('./anthropic', () => ({
  getClient: vi.fn(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            name: 'create_resume',
            input: {
              name: 'Test Resume',
              contact: {
                fullName: 'John Doe',
                email: 'john@example.com',
                phone: '555-1234',
                location: 'San Francisco, CA',
              },
              summary: 'Experienced engineer',
              experience: [
                {
                  company: 'Acme Corp',
                  title: 'Engineer',
                  startDate: '2020',
                  bullets: ['Built things'],
                },
              ],
              education: [
                {
                  institution: 'MIT',
                  degree: 'BS',
                  field: 'CS',
                },
              ],
              skills: [{ name: 'Languages', skills: ['TypeScript'] }],
            },
          },
        ],
      }),
    },
  })),
}))

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

describe('parseResumeWithClaude', () => {
  it('returns a Resume object with correct structure', async () => {
    const resume = await parseResumeWithClaude('John Doe resume text', 'test-key')

    expect(resume.id).toBeTruthy()
    expect(resume.name).toBe('Test Resume')
    expect(resume.templateId).toBe('classic')
    expect(resume.sections).toHaveLength(6)

    const contact = resume.sections.find((s) => s.content.type === 'contact')
    expect(contact).toBeDefined()
    expect(contact!.content.data).toEqual(
      expect.objectContaining({ fullName: 'John Doe', email: 'john@example.com' })
    )

    const experience = resume.sections.find((s) => s.content.type === 'experience')
    expect(experience).toBeDefined()
    expect(experience!.content.data.items).toHaveLength(1)
    expect(experience!.content.data.items[0].company).toBe('Acme Corp')
  })

  it('throws when no tool_use block is returned', async () => {
    const { getClient } = await import('./anthropic')
    vi.mocked(getClient).mockReturnValueOnce({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'no tool use' }],
        }),
      },
    } as never)

    await expect(
      parseResumeWithClaude('resume text', 'test-key')
    ).rejects.toThrow('Failed to parse resume')
  })
})
