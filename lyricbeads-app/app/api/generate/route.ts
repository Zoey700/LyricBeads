import { NextRequest, NextResponse } from 'next/server'

// 生图服务配置（按优先级排列）
const IMAGE_SERVICES = [
  {
    apiKey: 'sk-XpDwwiuGjDYDxp2ONOAsyV5zjwGIYvivSzDPdrAG7qVZuR2D',
    apiUrl: 'https://ai.t8star.org/v1/images/generations',
    model: 'gpt-image-2',
  },
  {
    apiKey: 'sk-UMhtPwCH9m4h6GScgpwYPLovMqYhm0zqZ8YVE4rF7nZ2UW6n',
    apiUrl: 'https://api.tu-zi.com/v1/images/generations',
    model: 'gpt-image-2-vip',
  },
]

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

    // 按优先级尝试每个生图服务
    for (const service of IMAGE_SERVICES) {
      try {
        // 准备请求参数
        const requestBody: any = {
          model: service.model,
          prompt: prompt,
          size: '1024x1024',
          response_format: 'url',
        }

        // 如果有参考图片，添加到 image 参数
        if (REFERENCE_IMAGES.length > 0) {
          requestBody.image = REFERENCE_IMAGES
        }

        // 调用图片生成 API，设置 10 分钟超时
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000)

        const response = await fetch(service.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${service.apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()

          if (data.data && data.data.length > 0 && data.data[0].url) {
            const imageUrl = data.data[0].url
            console.log(`使用 ${service.apiUrl} 生成图片成功`)
            return NextResponse.json({ imageUrl })
          }
        }

        console.warn(`${service.apiUrl} 响应失败，尝试下一个服务`)
      } catch (error: any) {
        console.warn(`${service.apiUrl} 请求失败: ${error.message}，尝试下一个服务`)
      }
    }

    // 所有服务都失败
    return NextResponse.json(
      { error: '所有生图服务均不可用，请稍后重试' },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('生成手链图片失败:', error)
    return NextResponse.json(
      { error: error.message || '生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}
