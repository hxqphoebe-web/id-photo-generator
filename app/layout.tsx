import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI证件照生成器',
  description: '上传照片,AI智能生成精美证件照',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
