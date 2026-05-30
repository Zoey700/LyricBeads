// 设置第一个注册用户为管理员
// 通过数据库直接操作（使用 postgres 连接）

const supabaseUrl = 'https://obgupwnrfietechhttlo.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZ3Vwd25yZmlldGVjaGh0dGxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkyNzcxNCwiZXhwIjoyMDk0NTAzNzE0fQ.VNKLpM6_QdG2dVQqZQ3yCNHXSWW8wKyqXWqK6yCR-L4';

async function setFirstUserAsAdmin() {
  try {
    console.log('正在获取第一个注册用户...');

    // 直接查询数据库获取用户（使用 postgres 扩展）
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_first_user`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('RPC 函数不存在，尝试其他方法...');
    }
  } catch (err) {
    console.error('执行出错:', err.message);
  }
}

// 使用 Supabase 客户端库的方式
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setFirstUserViaClient() {
  try {
    console.log('尝试获取用户列表...');

    // 使用 getAllUsers 方法（如果可用）
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('错误详情:', error);
      console.log('\n提示：');
      console.log('1. 请检查 .env.local 中的 SUPABASE_SERVICE_ROLE_KEY 是否正确');
      console.log('2. 或者手动在 Supabase Dashboard 中设置：');
      console.log('   - 打开 Authentication > Users');
      console.log('   - 找到第一个用户');
      console.log('   - 点击 Edit > Raw user metadata');
      console.log('   - 添加: "role": "admin"');
      return;
    }

    if (!users || users.length === 0) {
      console.log('暂无用户');
      return;
    }

    // 按创建时间排序
    const firstUser = users.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )[0];

    console.log(`第一个用户: ${firstUser.email}`);
    console.log(`当前角色: ${firstUser.user_metadata?.role || '未设置'}`);

    if (firstUser.user_metadata?.role === 'admin') {
      console.log('该用户已经是管理员');
      return;
    }

    // 更新用户
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(firstUser.id, {
      user_metadata: {
        ...firstUser.user_metadata,
        role: 'admin'
      }
    });

    if (updateError) {
      console.error('更新失败:', updateError);
      return;
    }

    console.log('✓ 成功将第一个用户设置为管理员！');
    console.log(`  邮箱: ${firstUser.email}`);
  } catch (err) {
    console.error('执行出错:', err.message);
  }
}

setFirstUserViaClient();
