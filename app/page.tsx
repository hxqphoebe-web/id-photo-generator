'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';

const GENERATION_LIMIT = 2;
const ONE_HOUR = 60 * 60 * 1000;

interface GenerationRecord {
  count: number;
  resetTime: number;
}

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [remainingGenerations, setRemainingGenerations] = useState(2);
  const [showAgreement, setShowAgreement] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [pendingAction, setPendingAction] = useState<'upload' | 'generate' | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const checkGenerationLimit = useCallback(() => {
    const stored = localStorage.getItem('generationRecord');
    if (!stored) {
      return GENERATION_LIMIT;
    }
    
    const record: GenerationRecord = JSON.parse(stored);
    const now = Date.now();
    
    if (now >= record.resetTime) {
      localStorage.setItem('generationRecord', JSON.stringify({
        count: 0,
        resetTime: now + ONE_HOUR
      }));
      return GENERATION_LIMIT;
    }
    
    return Math.max(0, GENERATION_LIMIT - record.count);
  }, []);

  useEffect(() => {
    setRemainingGenerations(checkGenerationLimit());
    const agreed = localStorage.getItem('userAgreement');
    if (!agreed) {
      setShowAgreement(true);
    } else {
      setHasAgreed(true);
    }
  }, [checkGenerationLimit]);

  const promptMap = {
    male: '基于参考图生成一张1:1比例的职业证件照，要求： 1. 人物部分：**完全保留我提供照片中的发型、五官、头部姿态和面部特征，不做任何修改**，仅替换服装与背景。 2. 服装部分：穿着**深蓝色长袖职业西装，内搭白色衬衫**，商务干练。 3. 背景部分：使用**浅淡均匀的浅灰色纹理背景**。 4. 构图与光影：上半身构图，露出肩膀及以上，头肩比正常，人物居中，身体向左微侧，保持脸部直面镜头；采用柔和自然的棚拍打光，突出真实肤色与面部层次感，皮肤通透有气色，面部清晰对焦，背景轻微虚化，营造专业干净的商务氛围。 5. 神态要求：保持原照片的神情，自然自信、眼神明亮，微笑真诚，传递健康活力的专业气质。',
    female: '基于参考图生成一张1:1比例的职业证件照，要求： 1. 人物部分：**完全保留我提供照片中的发型、五官、头部姿态和面部特征，不做任何修改**，仅替换服装与背景。 2. 服装部分：穿着**深蓝色长袖职业西装，西装不要有褶皱，内搭米白色真丝V领衬衫**，商务干练。 3. 背景部分：使用**浅淡均匀的浅灰色纹理背景**。 4. 构图与光影：上半身构图，露出肩膀及以上，头肩比正常，人物主体居中，身体向左微侧，保持脸部直面镜头；采用柔和自然的棚拍打光，突出真实肤色与面部层次感，皮肤通透有气色，面部清晰对焦，背景轻微虚化，营造专业干净的商务氛围。 5. 神态要求：保持原照片的神情，自然自信、眼神明亮，微笑真诚，传递健康活力的专业气质。',
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      if (!hasAgreed) {
        setPendingFile(file);
        setPendingAction('upload');
        setShowAgreement(true);
      } else {
        handleFile(file);
      }
    }
  }, [hasAgreed]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!hasAgreed) {
        setPendingFile(file);
        setPendingAction('upload');
        setShowAgreement(true);
      } else {
        handleFile(file);
      }
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setGeneratedImage(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!uploadedImage) {
      setError('请先上传照片');
      return;
    }

    if (!hasAgreed) {
      setPendingAction('generate');
      setShowAgreement(true);
    } else {
      executeGenerate();
    }
  };

  const handleConfirmAgreement = () => {
    localStorage.setItem('userAgreement', 'true');
    setHasAgreed(true);
    setShowAgreement(false);
    setAgreementChecked(true);
  };

  const executeGenerate = async () => {
    const remaining = checkGenerationLimit();
    if (remaining <= 0) {
      setError('额度不足，请联系管理员胡小琪充值');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_VOLCENGINE_API_KEY}`
        },
        body: JSON.stringify({
          model: 'doubao-seedream-5-0-260128',
          prompt: promptMap[gender],
          image: uploadedImage,
          sequential_image_generation: 'disabled',
          response_format: 'url',
          size: '2K',
          stream: false,
          watermark: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'AI服务请求失败');
      }

      const data = await response.json();

      if (!data.data || !data.data[0] || !data.data[0].url) {
        throw new Error('生成失败,未返回有效图像');
      }

      setGeneratedImage(data.data[0].url);

      const stored = localStorage.getItem('generationRecord');
      const now = Date.now();
      let record: GenerationRecord;
      
      if (!stored) {
        record = { count: 1, resetTime: now + ONE_HOUR };
      } else {
        record = JSON.parse(stored);
        record.count += 1;
      }
      
      localStorage.setItem('generationRecord', JSON.stringify(record));
      setRemainingGenerations(checkGenerationLimit());
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败,请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `AI生成图像_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setUploadedImage(null);
    setGeneratedImage(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-slate-800">
            <span className="text-primary-600">MT</span>证件照生成器
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">1. 上传照片</h2>
              
              {!uploadedImage ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                    isDragging
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="text-5xl mb-4">📷</div>
                  <p className="text-slate-600 mb-4">拖拽图片到此处,或点击选择</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                  />
                  <label
                    htmlFor="file-input"
                    className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-lg cursor-pointer hover:bg-primary-700 transition-colors"
                  >
                    选择图片
                  </label>
                  <p className="text-xs text-slate-400 mt-4">支持 JPG、PNG 格式,建议使用近照正面照片</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative w-full aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden">
                    <Image
                      src={uploadedImage}
                      alt="上传的照片"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    onClick={handleReset}
                    className="absolute top-2 right-2 bg-slate-800/70 text-white p-2 rounded-full hover:bg-slate-900 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">2. 选择性别</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setGender('male')}
                  className={`flex-1 py-4 px-4 rounded-xl border-2 transition-all duration-200 ${
                    gender === 'male'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-3xl block mb-2">👨</span>
                  <span className="font-medium">男士商务照</span>
                  <p className="text-xs text-slate-500 mt-1">深蓝色背景 西装外套</p>
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`flex-1 py-4 px-4 rounded-xl border-2 transition-all duration-200 ${
                    gender === 'female'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-3xl block mb-2">👩</span>
                  <span className="font-medium">女士商务照</span>
                  <p className="text-xs text-slate-500 mt-1">深蓝色背景 职业连衣裙</p>
                </button>
              </div>
            </section>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!uploadedImage || isGenerating || remainingGenerations <= 0}
              className="w-full bg-primary-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-primary-200"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  AI生成中...
                </span>
              ) : (
                <span>
                  {remainingGenerations <= 0 ? '额度已用尽' : `✨ 开始生成图像 (${remainingGenerations}/2)`}
                </span>
              )}
            </button>
          </div>

          <div className="space-y-6">
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">预览结果</h2>
              
              {!generatedImage ? (
                <div className="aspect-[3/4] bg-slate-100 rounded-xl flex items-center justify-center">
                  <div className="text-center text-slate-400">
                    <div className="text-6xl mb-4">🖼️</div>
                    <p>生成后预览</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative w-full aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden">
                    <img
                      src={generatedImage}
                      alt="生成的证件照"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <span>⬇️</span>
                      下载图像
                    </button>
                  </div>
                  
                  <p className="text-xs text-slate-500 text-center">
                    生成结果仅供个人使用,请遵守当地法规
                  </p>
                </div>
              )}
            </section>

            <section className="bg-primary-50 rounded-2xl border border-primary-100 p-6">
              <h3 className="font-semibold text-primary-800 mb-2">💡 提示</h3>
              <ul className="text-sm text-primary-700 space-y-1">
                <li>▪ 操作：上传一张免冠正面高清照，小于2M，需包括胸部及以上区域，光线明亮柔和，五官清晰，背景纯色干净；选择对应性别，进行生成，每人可生成2次</li>
                <li>▪ 等待：AI生成约10-30秒，若人数较多，可能延迟，请耐心等待</li>
                <li>▪ 反馈：若遇到技术问题，如网页无法点击，请联系Wang Xiaobing，若遇到照片生成问题，如照片无法下载，请联系Hu Xiaoqi</li>
                <li>▪ 结果：AI生成结果存在不确定性，若对结果不满意，可进行二次尝试</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      {showAgreement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">请仔细阅读并确认</h3>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <div className="text-sm text-slate-600 space-y-3">
                <p>1.用户上传图片行为，即视为已充分理解并不可撤销地同意：本平台有权对用户上传的图片进行必要处理，处理范围仅限于对图片进行商务风格转化。</p>
                <p>2.本平台承诺：除为完成处理所必需的临时调用外，不对用户上传的图片进行永久存储、留存、备份或二次使用，处理完成后相关数据将即时清除，不用于任何其他用途。</p>
                <p>3.本网站及相关服务将于2026 年 3 月 31 日正式下线，下线后所有相关功能、接口及数据处理服务将全部停止，不再接受图片上传及处理请求。</p>
                <p>4.用户确认上传的图片为自身合法持有或已取得完整授权，不侵犯任何第三方肖像权、著作权、隐私权及其他合法权益；如因用户上传行为引发纠纷或法律责任，由用户自行承担。</p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreementChecked}
                  onChange={(e) => setAgreementChecked(e.target.checked)}
                  className="mt-1 w-5 h-5 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-600">我已阅读并同意上述协议内容</span>
              </label>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowAgreement(false);
                    setPendingAction(null);
                    setPendingFile(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmAgreement}
                  disabled={!agreementChecked}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-200 mt-12 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-slate-500 text-sm">
          © 2024 MT证件照生成器 - 智能便捷的图像制作工具
        </div>
      </footer>
    </div>
  );
}
