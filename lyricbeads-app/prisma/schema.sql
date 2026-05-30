-- ============================================
-- LyricBeads 本地数据库初始化脚本
-- 在 PostgreSQL 中运行此脚本
-- ============================================

-- 删除已存在的表（如果需要重新创建）
-- DROP TABLE IF EXISTS browsing_history CASCADE;
-- DROP TABLE IF EXISTS favorites CASCADE;
-- DROP TABLE IF EXISTS likes CASCADE;
-- DROP TABLE IF EXISTS posts CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================
-- 1. 创建用户资料表
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. 创建帖子表
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    emotion_type VARCHAR(50),
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_posts_user_id FOREIGN KEY (user_id)
        REFERENCES profiles(id) ON DELETE CASCADE
);

-- ============================================
-- 3. 创建点赞表
-- ============================================
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_likes_post_id FOREIGN KEY (post_id)
        REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_likes_user_id FOREIGN KEY (user_id)
        REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT uq_likes_post_user UNIQUE (post_id, user_id)
);

-- ============================================
-- 4. 创建收藏表
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_favorites_post_id FOREIGN KEY (post_id)
        REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_user_id FOREIGN KEY (user_id)
        REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT uq_favorites_post_user UNIQUE (post_id, user_id)
);

-- ============================================
-- 5. 创建浏览历史表
-- ============================================
CREATE TABLE IF NOT EXISTS browsing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_browsing_history_post_id FOREIGN KEY (post_id)
        REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_browsing_history_user_id FOREIGN KEY (user_id)
        REFERENCES profiles(id) ON DELETE CASCADE
);

-- ============================================
-- 创建索引以提高查询性能
-- ============================================

-- posts 表索引
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_public ON posts(is_public);
CREATE INDEX IF NOT EXISTS idx_posts_emotion_type ON posts(emotion_type);

-- likes 表索引
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);

-- favorites 表索引
CREATE INDEX IF NOT EXISTS idx_favorites_post_id ON favorites(post_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);

-- browsing_history 表索引
CREATE INDEX IF NOT EXISTS idx_browsing_history_user_id ON browsing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_browsing_history_created_at ON browsing_history(created_at DESC);

-- profiles 表索引
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ============================================
-- 插入测试数据（可选）
-- ============================================

-- 插入测试用户
INSERT INTO profiles (id, username, full_name, avatar_url)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'testuser', '测试用户', NULL),
    ('22222222-2222-2222-2222-222222222222', 'alice', 'Alice', NULL),
    ('33333333-3333-3333-3333-333333333333', 'bob', 'Bob', NULL)
ON CONFLICT (id) DO NOTHING;

-- 插入测试帖子
INSERT INTO posts (user_id, content, emotion_type, is_public)
VALUES
    ('11111111-1111-1111-1111-111111111111', '今天天气真好，心情特别愉快！', 'happy', true),
    ('22222222-2222-2222-2222-222222222222', '听着这首歌，想起了很多往事...', 'nostalgic', true),
    ('33333333-3333-3333-3333-333333333333', '生活就像一盒巧克力，你永远不知道下一颗是什么味道。', 'hopeful', true)
ON CONFLICT DO NOTHING;

-- 插入测试点赞
INSERT INTO likes (post_id, user_id)
SELECT id, '22222222-2222-2222-2222-222222222222' FROM posts LIMIT 2
ON CONFLICT (post_id, user_id) DO NOTHING;

-- 插入测试收藏
INSERT INTO favorites (post_id, user_id)
SELECT id, '33333333-3333-3333-3333-333333333333' FROM posts LIMIT 1
ON CONFLICT (post_id, user_id) DO NOTHING;

-- ============================================
-- 查询验证（可选）
-- ============================================

-- 查看所有表
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- 查看每个表的数据量
-- SELECT
--     'posts' as table_name, COUNT(*) as count FROM posts
-- UNION ALL SELECT 'profiles', COUNT(*) FROM profiles
-- UNION ALL SELECT 'likes', COUNT(*) FROM likes
-- UNION ALL SELECT 'favorites', COUNT(*) FROM favorites
-- UNION ALL SELECT 'browsing_history', COUNT(*) FROM browsing_history;

-- ============================================
-- 使用说明
-- ============================================

-- 1. 在本地 PostgreSQL 中运行：
--    psql -U your_username -d lyricbeads -f schema.sql
--
-- 2. 或使用 Docker：
--    docker run -d --name lyricbeads-db \
--      -e POSTGRES_USER=postgres \
--      -e POSTGRES_PASSWORD=postgres \
--      -e POSTGRES_DB=lyricbeads \
--      -p 5432:5432 \
--      postgres:16
--
--    然后运行：psql -h localhost -U postgres -d lyricbeads -f schema.sql
--
-- 3. 查看数据：
--    psql -U your_username -d lyricbeads
--    \dt
--    SELECT * FROM posts;
