import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { readFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const BUCKET_NAME = 'bracelet-images'

export async function POST(request: NextRequest) {
  try {
    const { imageName } = await request.json()

    if (!imageName) {
      return NextResponse.json({ error: '需要提供图片名称' }, { status: 400 })
    }

    // 读取本地图片文件
    const projectRoot = process.cwd()
    const imagePath = join(projectRoot, '..', imageName)

    const fileBuffer = readFileSync(imagePath)

    // 上传到 Supabase Storage 的 references 文件夹
    const fileName = `references/${imageName}`

    const uploadResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${fileName}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'image/jpeg',
        },
        body: fileBuffer,
      }
    )

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('上传失败:', errorText)
      throw new Error('上传失败')
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      fileName,
    })
  } catch (error: any) {
    console.error('上传参考图片失败:', error)
    return NextResponse.json(
      { error: error.message || '上传失败' },
      { status: 500 }
    )
  }
}
