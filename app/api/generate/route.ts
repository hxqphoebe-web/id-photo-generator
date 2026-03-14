import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { image, prompt } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: '请上传图片' },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: '请输入描述提示词' },
        { status: 400 }
      );
    }

    const apiKey = process.env.VOLCENGINE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: '请配置 VOLCENGINE_API_KEY 环境变量' },
        { status: 500 }
      );
    }

    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'doubao-seedream-5-0-260128',
        prompt: prompt,
        image: image,
        sequential_image_generation: 'disabled',
        response_format: 'url',
        size: '2K',
        stream: false,
        watermark: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('火山引擎API错误:', errorData);
      throw new Error(errorData.message || 'AI服务请求失败');
    }

    const data = await response.json();

    if (!data.data || !data.data[0] || !data.data[0].url) {
      throw new Error('生成失败,未返回有效图像');
    }

    const result = data.data[0].url;

    return NextResponse.json({ result });
  } catch (error) {
    console.error('生成错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成失败,请稍后重试' },
      { status: 500 }
    );
  }
}
