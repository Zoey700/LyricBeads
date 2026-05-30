-- LyricBeads 数据库初始化 SQL
-- 从 Supabase 生产环境同步
-- 生成时间: 2026-05-30

-- ============================================
-- 表结构
-- ============================================

-- posts 表：存储用户发布的手链内容
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    emotion_type TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- profiles 表：用户资料
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- likes 表：点赞记录
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- favorites 表：收藏记录
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- browsing_history 表：浏览历史
CREATE TABLE IF NOT EXISTS public.browsing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- comments 表：评论
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- comment_likes 表：评论点赞
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 索引
-- ============================================

-- posts 索引
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_public ON public.posts USING btree (is_public);

-- profiles 索引
-- 主键索引已自动创建

-- likes 索引
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes USING btree (post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS likes_post_id_user_id_key ON public.likes USING btree (post_id, user_id);

-- favorites 索引
CREATE INDEX IF NOT EXISTS idx_favorites_post_id ON public.favorites USING btree (post_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS favorites_post_id_user_id_key ON public.favorites USING btree (post_id, user_id);

-- browsing_history 索引
CREATE INDEX IF NOT EXISTS idx_browsing_history_user_id ON public.browsing_history USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_browsing_history_created_at ON public.browsing_history USING btree (created_at DESC);

-- comments 索引
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments USING btree (post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments USING btree (created_at DESC);

-- comment_likes 索引
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes USING btree (comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_comment_likes_comment_user ON public.comment_likes USING btree (comment_id, user_id);

-- ============================================
-- 行级安全策略 (RLS)
-- ============================================

-- 启用 RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.browsing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- posts RLS 策略
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;
CREATE POLICY "Public posts are viewable by everyone"
    ON public.posts FOR SELECT
    USING (is_public = true);

DROP POLICY IF EXISTS "Users can view own posts" ON public.posts;
CREATE POLICY "Users can view own posts"
    ON public.posts FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own posts" ON public.posts;
CREATE POLICY "Users can insert own posts"
    ON public.posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts"
    ON public.posts FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts"
    ON public.posts FOR DELETE
    USING (auth.uid() = user_id);

-- profiles RLS 策略
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- likes RLS 策略
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
CREATE POLICY "Likes are viewable by everyone"
    ON public.likes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert own likes" ON public.likes;
CREATE POLICY "Users can insert own likes"
    ON public.likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;
CREATE POLICY "Users can delete own likes"
    ON public.likes FOR DELETE
    USING (auth.uid() = user_id);

-- favorites RLS 策略
DROP POLICY IF EXISTS "Favorites are viewable by everyone" ON public.favorites;
CREATE POLICY "Favorites are viewable by everyone"
    ON public.favorites FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert own favorites" ON public.favorites;
CREATE POLICY "Users can insert own favorites"
    ON public.favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;
CREATE POLICY "Users can delete own favorites"
    ON public.favorites FOR DELETE
    USING (auth.uid() = user_id);

-- browsing_history RLS 策略
DROP POLICY IF EXISTS "Users can view own browsing history" ON public.browsing_history;
CREATE POLICY "Users can view own browsing history"
    ON public.browsing_history FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own browsing history" ON public.browsing_history;
CREATE POLICY "Users can insert own browsing history"
    ON public.browsing_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- comments RLS 策略
DROP POLICY IF EXISTS "允许所有人查看评论" ON public.comments;
CREATE POLICY "允许所有人查看评论"
    ON public.comments FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "允许认证用户插入评论" ON public.comments;
CREATE POLICY "允许认证用户插入评论"
    ON public.comments FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "允许用户更新自己的评论" ON public.comments;
CREATE POLICY "允许用户更新自己的评论"
    ON public.comments FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "允许用户删除自己的评论" ON public.comments;
CREATE POLICY "允许用户删除自己的评论"
    ON public.comments FOR DELETE
    USING (user_id = auth.uid());

-- comment_likes RLS 策略
DROP POLICY IF EXISTS "允许所有人查看评论点赞" ON public.comment_likes;
CREATE POLICY "允许所有人查看评论点赞"
    ON public.comment_likes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "允许认证用户插入评论点赞" ON public.comment_likes;
CREATE POLICY "允许认证用户插入评论点赞"
    ON public.comment_likes FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "允许用户删除自己的评论点赞" ON public.comment_likes;
CREATE POLICY "允许用户删除自己的评论点赞"
    ON public.comment_likes FOR DELETE
    USING (user_id = auth.uid());

-- ============================================
-- 触发器 (可选)
-- ============================================

-- 更新 updated_at 字段的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 comments 表创建更新时间戳触发器
DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为 profiles 表创建更新时间戳触发器
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
