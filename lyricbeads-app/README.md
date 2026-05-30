# LyricBeads - 个性化手链生成小程序

根据心情、诗词、歌词生成专属个性化手链的移动端 H5 应用。

## 功能特性

- ✅ 用户认证系统（邮箱登录、Google OAuth）
- ✅ 内容创作（文字输入/语音录音）
- ✅ AI 生成手链图片（使用 OpenAI DALL-E 3）
- ✅ 社区广场（浏览、点赞、收藏、分享）
- ✅ 个人中心（浏览记录、点赞列表、收藏列表、我的创作）
- ✅ 移动端 H5 自适应布局

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **AI 生成**: OpenAI DALL-E 3
- **认证**: Supabase Auth

## 环境配置

1. `.env.local` 已配置 Supabase 连接信息

2. 需要配置 OpenAI API Key 才能使用 AI 生成功能：

\`\`\`bash
OPENAI_API_KEY=your_openai_api_key
\`\`\`

3. 安装依赖：

\`\`\`bash
npm install
\`\`\`

4. 启动开发服务器：

\`\`\`bash
npm run dev
\`\`\`

5. 访问 `http://localhost:3000`

## 数据库结构

### 表结构

- \`posts\` - 帖子表（内容、手链图片）
- \`likes\` - 点赞表
- \`favorites\` - 收藏表
- \`browsing_history\` - 浏览记录表

## 项目结构

\`\`\`
lyricbeads-app/
├── app/
│   ├── api/
│   │   ├── auth/          # 认证回调
│   │   └── generate/      # AI 生成图片
│   ├── community/         # 社区页面
│   ├── create/            # 创作页面
│   ├── favorites/         # 收藏页面
│   ├── login/             # 登录页面
│   ├── post/[id]/         # 帖子详情
│   ├── profile/           # 个人中心
│   ├── settings/          # 设置页面
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── BottomNav.tsx      # 底部导航
│   ├── CommunityFeed.tsx  # 社区内容流
│   ├── FavoritesList.tsx  # 收藏列表
│   ├── HomeFeed.tsx       # 首页内容流
│   ├── PostDetail.tsx     # 帖子详情
│   └── UserProfile.tsx    # 用户资料
├── lib/
│   └── supabase/          # Supabase 客户端
├── types/
│   └── index.ts           # TypeScript 类型
└── .env.local             # 环境变量
\`\`\`

## 情绪类型

支持 8 种情绪类型：
- 快乐 (happy)
- 伤感 (sad)
- 浪漫 (romantic)
- 宁静 (peaceful)
- 活力 (energetic)
- 忧郁 (melancholy)
- 希望 (hopeful)
- 怀旧 (nostalgic)

## 部署

### Vercel

\`\`\`bash
npm run build
vercel deploy
\`\`\`

### 其他平台

确保配置环境变量后，构建并启动：

\`\`\`bash
npm run build
npm start
\`\`\`

## 注意事项

1. 需要配置有效的 OpenAI API Key 才能使用 AI 生成功能
2. Supabase 项目需要启用 Email Auth 和 Google OAuth
3. 建议使用移动端浏览器进行测试以获得最佳体验

## License

MIT
