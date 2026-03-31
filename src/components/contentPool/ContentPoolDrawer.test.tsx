import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContentPoolDrawer } from './ContentPoolDrawer'

vi.mock('./ContentPoolPage', () => ({
  ContentPoolPage: () => <div data-testid="content-pool-page">ContentPoolPage</div>,
}))

describe('ContentPoolDrawer', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<ContentPoolDrawer open={false} onClose={vi.fn()} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders ContentPoolPage when open', () => {
    render(<ContentPoolDrawer open={true} onClose={vi.fn()} />)
    expect(screen.getByText('Content Pool')).toBeInTheDocument()
    expect(screen.getByTestId('content-pool-page')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ContentPoolDrawer open={true} onClose={onClose} />)
    await user.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when backdrop clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ContentPoolDrawer open={true} onClose={onClose} />)
    // The backdrop is the first div with the bg-black class
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/20')
    expect(backdrop).toBeTruthy()
    await user.click(backdrop!)
    expect(onClose).toHaveBeenCalled()
  })
})
