export interface User {
  id: string
  email?: string
  user_metadata?: {
    name?: string
    avatar_url?: string
    role?: 'admin' | 'user'
  }
}

export interface Post {
  id: string
  user_id: string
  content: string
  image_url?: string
  emotion_type?: string
  is_public: boolean
  created_at: string
  user?: User
  likes_count?: number
  views_count?: number
  is_liked?: boolean
  is_favorited?: boolean
}

export interface Like {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface Favorite {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface BrowsingHistory {
  id: string
  user_id: string
  post_id: string
  created_at: string
  post?: Post
}

export type EmotionType = 'happy' | 'sad' | 'romantic' | 'peaceful' | 'energetic' | 'melancholy' | 'hopeful' | 'nostalgic'

export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  user?: User
  likes_count?: number
  is_liked?: boolean
}
