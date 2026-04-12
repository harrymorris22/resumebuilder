import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignInButton } from './SignInButton'

const signIn = vi.fn()

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SignInButton', () => {
  it('renders a "Sign in" button', () => {
    render(<SignInButton />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('calls signIn from useAuth when clicked', async () => {
    const user = userEvent.setup()
    render(<SignInButton />)
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(signIn).toHaveBeenCalledOnce()
  })

  it('shows a Google SVG icon', () => {
    render(<SignInButton />)
    const button = screen.getByRole('button', { name: /sign in/i })
    const svg = button.querySelector('svg')
    expect(svg).toBeInTheDocument()
    // Google icon has the characteristic blue path fill
    const paths = svg!.querySelectorAll('path')
    expect(paths.length).toBe(4)
    expect(paths[0].getAttribute('fill')).toBe('#4285F4')
  })
})
