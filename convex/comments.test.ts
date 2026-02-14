/* @vitest-environment node */
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./lib/access', () => ({
  assertRole: vi.fn(),
  requireUser: vi.fn(),
}))

const { requireUser } = await import('./lib/access')
const { __test } = await import('./comments')

describe('comments mutations', () => {
  afterEach(() => {
    vi.mocked(requireUser).mockReset()
  })

  it('add updates comment count without touching updatedAt', async () => {
    vi.mocked(requireUser).mockResolvedValue({
      userId: 'users:1',
      user: { _id: 'users:1', role: 'user' },
    } as never)

    const get = vi.fn().mockResolvedValue({
      _id: 'skills:1',
      stats: { comments: 2 },
    })
    const insert = vi.fn()
    const patch = vi.fn()
    const ctx = { db: { get, insert, patch } } as never

    await __test.addHandler(ctx, { skillId: 'skills:1', body: ' hello ' } as never)

    expect(patch).toHaveBeenCalledTimes(1)
    expect(patch).toHaveBeenCalledWith('skills:1', {
      stats: { comments: 3 },
    })
    const skillPatch = vi.mocked(patch).mock.calls[0]?.[1] as Record<string, unknown>
    expect(skillPatch.updatedAt).toBeUndefined()
  })

  it('remove updates comment count without touching updatedAt', async () => {
    vi.mocked(requireUser).mockResolvedValue({
      userId: 'users:2',
      user: { _id: 'users:2', role: 'moderator' },
    } as never)

    const comment = {
      _id: 'comments:1',
      skillId: 'skills:1',
      userId: 'users:2',
      softDeletedAt: undefined,
    }
    const skill = {
      _id: 'skills:1',
      stats: { comments: 4 },
    }

    const get = vi.fn(async (id: string) => {
      if (id === 'comments:1') return comment
      if (id === 'skills:1') return skill
      return null
    })
    const insert = vi.fn()
    const patch = vi.fn()
    const ctx = { db: { get, insert, patch } } as never

    await __test.removeHandler(ctx, { commentId: 'comments:1' } as never)

    expect(patch).toHaveBeenCalledTimes(2)
    expect(patch).toHaveBeenNthCalledWith(2, 'skills:1', {
      stats: { comments: 3 },
    })
    const skillPatch = vi.mocked(patch).mock.calls[1]?.[1] as Record<string, unknown>
    expect(skillPatch.updatedAt).toBeUndefined()
  })
})
