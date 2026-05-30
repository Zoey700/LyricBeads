import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = 'https://obgupwnrfietechhttlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZ3Vwd25yZmlldGVjaGh0dGxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkyNzcxNCwiZXhwIjoyMDk0NTAzNzE0fQ.VNKLpM6_QdG2dVQqZQ3yCNHXSWW8wKyqXWqK6yCR-L4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadImage(fileName, localPath) {
  try {
    const fileContent = readFileSync(localPath);

    const { data, error } = await supabase.storage
      .from('bracelet-images')
      .upload(`references/${fileName}`, fileContent, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error(`上传 ${fileName} 失败:`, error.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('bracelet-images')
      .getPublicUrl(`references/${fileName}`);

    console.log(`✓ ${fileName} 上传成功: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.error(`上传 ${fileName} 出错:`, err.message);
    return null;
  }
}

async function main() {
  const baseDir = '/Users/zhouchunyu/Documents/lyricBeads';

  console.log('开始上传参考图片...');

  await uploadImage('image1.jpg', join(baseDir, 'image1.jpg'));
  await uploadImage('image2.jpg', join(baseDir, 'image2.jpg'));
  await uploadImage('image3.jpg', join(baseDir, 'image3.jpg'));

  console.log('上传完成！');
}

main().catch(console.error);
