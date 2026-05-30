-- ============================================
-- LyricBeads 本地数据库初始化脚本（纯净版）
-- 不包含测试数据，仅包含表结构
-- ============================================

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
-- 创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_public ON posts(is_public);
CREATE INDEX IF NOT EXISTS idx_posts_emotion_type ON posts(emotion_type);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_post_id ON favorites(post_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_browsing_history_user_id ON browsing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_browsing_history_created_at ON browsing_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
