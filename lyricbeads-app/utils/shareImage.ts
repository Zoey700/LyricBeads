/**
 * 创建包含文字内容和图片的分享卡片
 */
export async function createShareCard(
  imageUrl: string,
  content: string,
  username?: string
): Promise<boolean> {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return false

    // 卡片尺寸
    const cardWidth = 800
    const imageHeight = 600
    const padding = 40
    const textAreaHeight = 200
    const watermarkHeight = 40
    const cardHeight = imageHeight + textAreaHeight + watermarkHeight + padding * 2

    canvas.width = cardWidth
    canvas.height = cardHeight

    // 白色背景
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, cardWidth, cardHeight)

    // 加载并绘制图片
    const img = new Image()
    img.crossOrigin = 'anonymous'

    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = imageUrl
    })

    // 居中裁剪图片
    const imgRatio = img.naturalWidth / img.naturalHeight
    const targetRatio = cardWidth / imageHeight

    let sx, sy, sw, sh
    if (imgRatio > targetRatio) {
      sh = img.naturalHeight
      sw = sh * targetRatio
      sx = (img.naturalWidth - sw) / 2
      sy = 0
    } else {
      sw = img.naturalWidth
      sh = sw / targetRatio
      sx = 0
      sy = (img.naturalHeight - sh) / 2
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, padding, cardWidth, imageHeight)

    // 绘制文字内容
    ctx.fillStyle = '#1f2937'
    ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

    const lines = wrapText(ctx, content, cardWidth - padding * 2)
    let textY = padding + imageHeight + 20

    // 用户名
    if (username) {
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillStyle = '#6b7280'
      ctx.fillText(`@${username}`, padding, textY)
      textY += 30
      ctx.fillStyle = '#1f2937'
      ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }

    lines.forEach((line) => {
      ctx.fillText(line, padding, textY)
      textY += 28
    })

    // 底部水印
    const watermarkText = '由LyricBeads制作'
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    const textMetrics = ctx.measureText(watermarkText)
    const watermarkX = cardWidth - textMetrics.width - padding
    const watermarkY = cardHeight - padding - 10

    ctx.fillStyle = '#9ca3af'
    ctx.fillText(watermarkText, watermarkX, watermarkY)

    // 复制到剪贴板
    canvas.toBlob(async (blob) => {
      if (!blob) return

      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
      } catch (err) {
        console.error('复制到剪贴板失败:', err)
      }
    }, 'image/png')

    return true
  } catch (err) {
    console.error('生成分享卡片失败:', err)
    return false
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split('')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine + word
    const metrics = ctx.measureText(testLine)

    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  // 最多显示3行
  return lines.slice(0, 3)
}
