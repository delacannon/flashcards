import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { remarkHighlight } from '@/lib/remarkHighlight';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
}

const markdownComponents = {
  p: ({ children }: any) => (
    <p className="m-0" style={{ fontFamily: 'inherit' }}>
      {children}
    </p>
  ),
  mark: ({ children }: any) => (
    <mark className="bg-yellow-200 px-1 rounded">
      {children}
    </mark>
  ),
  strong: ({ children }: any) => (
    <strong className="font-bold">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="italic">{children}</em>
  ),
  code: ({ children }: any) => (
    <code className="bg-gray-100 px-1 rounded text-sm">
      {children}
    </code>
  ),
  pre: ({ children }: any) => (
    <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
      {children}
    </pre>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc list-inside space-y-1">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal list-inside space-y-1">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="ml-2">{children}</li>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic">
      {children}
    </blockquote>
  ),
  h1: ({ children }: any) => (
    <h1 className="text-2xl font-bold mb-2">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-xl font-bold mb-2">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-lg font-bold mb-1">{children}</h3>
  ),
  hr: () => <hr className="my-4 border-gray-300" />,
};

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className = '',
  style
}: MarkdownRendererProps) {
  return (
    <div 
      className={`prose prose-sm max-w-none ${className}`}
      style={style}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkHighlight]}
        rehypePlugins={[rehypeRaw]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});