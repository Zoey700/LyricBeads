-- ============================================
-- 添加评论表和评论点赞表
-- ============================================

-- ============================================
-- 1. 创建评论表
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_comments_post_id FOREIGN KEY (post_id)
        REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user_id FOREIGN KEY (user_id)
        REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================
-- 2. 创建评论点赞表
-- ============================================
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_comment_likes_comment_id FOREIGN KEY (comment_id)
        REFERENCES comments(id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_likes_user_id FOREIGN KEY (user_id)
        REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT uq_comment_likes_comment_user UNIQUE (comment_id, user_id)
);

-- ============================================
-- 创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- ============================================
-- RLS 策略（评论表）
-- ============================================
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "允许所有人查看评论" ON comments;
DROP POLICY IF EXISTS "允许认证用户插入评论" ON comments;
DROP POLICY IF EXISTS "允许用户更新自己的评论" ON comments;
DROP POLICY IF EXISTS "允许用户删除自己的评论" ON comments;

CREATE POLICY "允许所有人查看评论"
ON comments FOR SELECT
TO public
USING (true);

CREATE POLICY "允许认证用户插入评论"
ON comments FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "允许用户更新自己的评论"
ON comments FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "允许用户删除自己的评论"
ON comments FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- RLS 策略（评论点赞表）
-- ============================================
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "允许所有人查看评论点赞" ON comment_likes;
DROP POLICY IF EXISTS "允许认证用户插入评论点赞" ON comment_likes;
DROP POLICY IF EXISTS "允许用户删除自己的评论点赞" ON comment_likes;

CREATE POLICY "允许所有人查看评论点赞"
ON comment_likes FOR SELECT
TO public
USING (true);

CREATE POLICY "允许认证用户插入评论点赞"
ON comment_likes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "允许用户删除自己的评论点赞"
ON comment_likes FOR DELETE
TO authenticated
USING (user_id = auth.uid());
