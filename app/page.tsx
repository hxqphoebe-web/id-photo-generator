'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';

interface StyleOption {
  id: string;
  name: string;
  description: string;
  preview: string;
}

const styleOptions: StyleOption[] = [
  { id: 'business', name: '商务正装', description: '专业商务风格,适合职场', preview: '👔' },
  { id: 'casual', name: '休闲风格', description: '轻松自然,适合日常', preview: '👕' },
  { id: 'official', name: '正式证件', description: '标准证件照,官方认可', preview: '📋' },
  { id: 'smiling', name: '微笑证件', description: '微笑自然,亲和力强', preview: '😊' },
  { id: 'white-bg', name: '白色背景', description: '纯白背景,简洁大方', preview: '⬜' },
  { id: 'blue-bg', name: '蓝色背景', description: '蓝色背景,经典证件', preview: '🟦' },
];

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('official');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
      handleFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
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

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: uploadedImage,
          style: selectedStyle,
          gender,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '生成失败,请重试');
      }

      setGeneratedImage(data.result);
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
    link.download = `证件照_${styleOptions.find(s => s.id === selectedStyle)?.name || '生成'}.png`;
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
            <span className="text-primary-600">AI</span>证件照生成器
          </h1>
          <p className="text-slate-500 mt-2">上传照片,AI智能生成精美证件照</p>
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
                  className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 ${
                    gender === 'male'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl block mb-1">👨</span>
                  <span className="font-medium">男</span>
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 ${
                    gender === 'female'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl block mb-1">👩</span>
                  <span className="font-medium">女</span>
                </button>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">3. 选择风格</h2>
              <div className="grid grid-cols-2 gap-3">
                {styleOptions.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      selectedStyle === style.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{style.preview}</div>
                    <div className="font-medium text-slate-800">{style.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{style.description}</div>
                  </button>
                ))}
              </div>
            </section>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!uploadedImage || isGenerating}
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
                '✨ 开始生成证件照'
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
                    <Image
                      src={generatedImage}
                      alt="生成的证件照"
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <span>⬇️</span>
                      下载证件照
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
                <li>• 建议使用近期免冠正面照片</li>
                <li>• 照片光线均匀,面部清晰</li>
                <li>• 背景简单效果更好</li>
                <li>• AI生成需要约10-30秒</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 mt-12 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-slate-500 text-sm">
          © 2024 AI证件照生成器 - 智能便捷的证件照制作工具
        </div>
      </footer>
    </div>
  );
}
