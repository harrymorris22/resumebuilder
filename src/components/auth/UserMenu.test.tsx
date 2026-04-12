import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserMenu } from './UserMenu'

const signOut = vi.fn()

let mockUser: { displayName: string | null; email: string | null; photoURL: string | null } | null = null

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    signOut,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockUser = null
})

describe('UserMenu', () => {
  it('returns null when user is null', () => {
    mockUser = null
    const { container } = render(<UserMenu />)
    expect(container.firstChild).toBeNull()
  })

  it('shows user avatar when photoURL is present', () => {
    mockUser = { displayName: 'Jane Doe', email: 'jane@example.com', photoURL: 'https://example.com/avatar.jpg' }
    render(<UserMenu />)
    const button = screen.getByRole('button')
    const img = button.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('shows initials when no photoURL', () => {
    mockUser = { displayName: 'Jane Doe', email: 'jane@example.com', photoURL: null }
    render(<UserMenu />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('opens dropdown on click showing display name and email', async () => {
    mockUser = { displayName: 'Jane Doe', email: 'jane@example.com', photoURL: null }
    const user = userEvent.setup()
    render(<UserMenu />)

    await user.click(screen.getByRole('button'))

    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('sign out button calls signOut and closes dropdown', async () => {
    mockUser = { displayName: 'Jane Doe', email: 'jane@example.com', photoURL: null }
    const user = userEvent.setup()
    render(<UserMenu />)

    // Open dropdown
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Sign out')).toBeInTheDocument()

    // Click sign out
    await user.click(screen.getByText('Sign out'))
    expect(signOut).toHaveBeenCalledOnce()

    // Dropdown should be closed
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument()
  })

  it('clicking outside closes dropdown', async () => {
    mockUser = { displayName: 'Jane Doe', email: 'jane@example.com', photoURL: null }
    const user = userEvent.setup()
    render(<UserMenu />)

    // Open dropdown
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Sign out')).toBeInTheDocument()

    // Click outside
    await user.click(document.body)
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument()
  })
})
