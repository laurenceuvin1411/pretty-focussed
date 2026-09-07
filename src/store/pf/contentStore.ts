// Content: ideas caught before they go, posts planned into the week, numbers added after posting.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../../lib/workspace'

export type ContentFormat = 'reel' | 'carousel' | 'story' | 'post' | 'newsletter' | 'other'
export type Platform = 'instagram' | 'linkedin' | 'newsletter' | 'other'
export type PostStatus = 'planned' | 'drafted' | 'posted'

export const FORMAT_LABEL: Record<ContentFormat, string> = {
  reel: 'Reel', carousel: 'Carousel', story: 'Story', post: 'Post', newsletter: 'Newsletter', other: 'Other',
}
export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: 'Instagram', linkedin: 'LinkedIn', newsletter: 'Newsletter', other: 'Other',
}
export const STATUS_LABEL: Record<PostStatus, string> = { planned: 'Planned', drafted: 'Drafted', posted: 'Posted' }

export interface Idea {
  id: string
  title: string
  note?: string
  format?: ContentFormat
  createdAt: string
}

export interface Metrics {
  reach?: number
  saves?: number
  comments?: number
  follows?: number
  clicks?: number
}

export interface Post {
  id: string
  title: string
  format: ContentFormat
  platform: Platform
  date: string            // 'yyyy-MM-dd', the planned or actual day
  status: PostStatus
  hook?: string           // the first line
  note?: string
  ideaId?: string
  metrics?: Metrics
  createdAt: string
}

interface ContentStore {
  ideas: Idea[]
  posts: Post[]
  addIdea: (title: string, extra?: Partial<Idea>) => string | null
  updateIdea: (id: string, patch: Partial<Idea>) => void
  deleteIdea: (id: string) => void
  planIdea: (id: string, date: string, format?: ContentFormat, platform?: Platform) => string | null
  addPost: (input: { title: string; date: string; format?: ContentFormat; platform?: Platform; hook?: string; note?: string }) => string | null
  updatePost: (id: string, patch: Partial<Post>) => void
  deletePost: (id: string) => void
  setMetrics: (id: string, metrics: Metrics) => void
  postsBetween: (from: string, to: string) => Post[]
  postedBetween: (from: string, to: string) => Post[]
}

export const useContentStore = create<ContentStore>()(
  persist(
    (set, get) => ({
      ideas: [],
      posts: [],

      addIdea: (title, extra = {}) => {
        const t = title.trim(); if (!t) return null
        const id = crypto.randomUUID()
        set(s => ({ ideas: [{ id, title: t, createdAt: new Date().toISOString(), ...extra }, ...s.ideas] }))
        return id
      },
      updateIdea: (id, patch) => set(s => ({ ideas: s.ideas.map(i => i.id === id ? { ...i, ...patch } : i) })),
      deleteIdea: (id) => set(s => ({ ideas: s.ideas.filter(i => i.id !== id) })),

      planIdea: (id, date, format, platform) => {
        const idea = get().ideas.find(i => i.id === id); if (!idea) return null
        const postId = get().addPost({ title: idea.title, date, format: format ?? idea.format ?? 'post', platform: platform ?? 'instagram', note: idea.note })
        if (postId) {
          set(s => ({ ideas: s.ideas.filter(i => i.id !== id), posts: s.posts.map(p => p.id === postId ? { ...p, ideaId: id } : p) }))
        }
        return postId
      },

      addPost: ({ title, date, format = 'post', platform = 'instagram', hook, note }) => {
        const t = title.trim(); if (!t || !date) return null
        const id = crypto.randomUUID()
        set(s => ({ posts: [...s.posts, { id, title: t, format, platform, date, status: 'planned', hook, note, createdAt: new Date().toISOString() }] }))
        return id
      },
      updatePost: (id, patch) => set(s => ({ posts: s.posts.map(p => p.id === id ? { ...p, ...patch } : p) })),
      deletePost: (id) => set(s => ({ posts: s.posts.filter(p => p.id !== id) })),
      setMetrics: (id, metrics) => set(s => ({ posts: s.posts.map(p => p.id === id ? { ...p, metrics: { ...p.metrics, ...metrics }, status: 'posted' } : p) })),

      postsBetween: (from, to) => get().posts.filter(p => p.date >= from && p.date <= to).sort((a, b) => a.date.localeCompare(b.date)),
      postedBetween: (from, to) => get().postsBetween(from, to).filter(p => p.status === 'posted'),
    }),
    { name: scopedKey('pf-content-v1') }
  )
)

export function sumMetric(posts: Post[], key: keyof Metrics): number {
  return posts.reduce((a, p) => a + (p.metrics?.[key] ?? 0), 0)
}
