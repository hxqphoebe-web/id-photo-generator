import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { image, style, gender } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: '请上传图片' },
        { status: 400 }
      );
    }

    const apiKey = process.env.REPLICATE_API_KEY;
    
    if (!apiKey || apiKey === 'your_replicate_api_key_here') {
      return NextResponse.json({
        result: image,
        message: 'Demo模式: 请配置 REPLICATE_API_KEY 环境变量以启用AI生成',
      });
    }

    const stylePrompts: Record<string, string> = {
      'business': `Professional business attire, formal suit, white shirt, solid color background, ID photo style, ${gender === 'male' ? 'male' : 'female'} person`,
      'casual': `Casual clothing, relaxed style, natural look, ID photo, ${gender === 'male' ? 'male' : 'female'} person`,
      'official': `Official ID photo, formal attire, neutral expression, white or blue background, standard ID photo, ${gender === 'male' ? 'male' : 'female'} person`,
      'smiling': `ID photo with slight smile, friendly expression, professional look, ${gender === 'male' ? 'male' : 'female'} person`,
      'white-bg': `ID photo, white background, professional look, ${gender === 'male' ? 'male' : 'female'} person`,
      'blue-bg': `ID photo, blue background, professional look, ${gender === 'male' ? 'male' : 'female'} person`,
    };

    const prompt = stylePrompts[style] || stylePrompts['official'];

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'a8e40b65937cfddd460cfdb960f1a4c55a0f02b0b84b5ef6594f510b977a03f9',
        input: {
          prompt: prompt,
          image: image,
          num_inference_steps: 30,
          guidance_scale: 7.5,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('AI服务请求失败');
    }

    const prediction = await response.json();

    let result = image;
    let status = prediction.status;
    let predictionId = prediction.id;

    while (status === 'starting' || status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      const statusData = await statusResponse.json();
      status = statusData.status;
      
      if (status === 'succeeded' && statusData.output) {
        result = statusData.output;
      }
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('生成错误:', error);
    return NextResponse.json(
      { error: '生成失败,请稍后重试' },
      { status: 500 }
    );
  }
}
