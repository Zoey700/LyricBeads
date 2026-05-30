import { NextRequest, NextResponse } from 'next/server'

const API_KEY = 'sk-UMhtPwCH9m4h6GScgpwYPLovMqYhm0zqZ8YVE4rF7nZ2UW6n'
const API_URL = 'https://api.tu-zi.com/v1/images/generations'

// 参考图片 URL
const REFERENCE_IMAGES = [
  process.env.REFERENCE_IMAGE_1 || '',
  process.env.REFERENCE_IMAGE_2 || '',
  process.env.REFERENCE_IMAGE_3 || '',
].filter(Boolean)

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: '内容不能为空' },
        { status: 400 }
      )
    }

    const prompt = `根据参考图和文字内容生成符合情绪的手链，内容为："${content.substring(0, 5000)}"`

    // 准备请求参数
    const requestBody: any = {
      model: 'gpt-image-2-vip',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'medium',
    }

    // 如果有参考图片，添加到 image 参数
    if (REFERENCE_IMAGES.length > 0) {
      requestBody.image = REFERENCE_IMAGES
    }

    // 调用图片生成 API，设置 10 分钟超时
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000)

    let response: Response
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        })
        break // 成功则退出重试循环
      } catch (fetchError: any) {
        retryCount++
        if (retryCount >= maxRetries) {
          throw fetchError
        }
        console.warn(`图片生成请求失败，正在重试 (${retryCount}/${maxRetries})...`)
        // 等待 2 秒后重试
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    clearTimeout(timeoutId)

    if (!response!.ok) {
      const errorText = await response!.text()
      console.error('API 响应错误:', errorText)
      throw new Error(`API 请求失败: ${response!.status}`)
    }

    const data = await response!.json()

    if (!data.data || data.data.length === 0) {
      return NextResponse.json(
        { error: '未能生成图片，请重试' },
        { status: 500 }
      )
    }

    const imageUrl = data.data[0].url

    return NextResponse.json({
      imageUrl,
    })
  } catch (error: any) {
    console.error('生成手链图片失败:', error)

    // 处理超时错误
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: '图片生成超时，请稍后重试或减少文字长度' },
        { status: 408 }
      )
    }

    // 处理网络错误
    if (error.message === 'fetch failed' || error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: '网络连接失败，请检查网络后重试' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: error.message || '生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}
