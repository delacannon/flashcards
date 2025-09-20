import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { remarkHighlight } from '@/lib/remarkHighlight';
import { EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';

interface CardContentBaseProps {
  label: 'Question' | 'Answer';
  children: React.ReactNode;
}

export const CardContentBase = memo(function CardContentBase({ 
  label, 
  children 
}: CardContentBaseProps) {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center p-6">
      <div className="text-center w-full">
        <p className="text-xs opacity-70 mb-2">{label}</p>
        {children}
      </div>
    </div>
  );
});

interface MarkdownContentProps {
  content: string;
  style?: React.CSSProperties;
  placeholder?: string;
}

export const MarkdownContent = memo(function MarkdownContent({
  content,
  style,
  placeholder = 'No content yet'
}: MarkdownContentProps) {
  if (!content) {
    return <p className="m-0 opacity-50" style={style}>{placeholder}</p>;
  }

  return (
    <div 
      className="prose prose-sm max-w-none"
      style={style}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkHighlight]}
        rehypePlugins={[rehypeRaw]}
        components={{
          p: ({ children }) => (
            <p className="m-0" style={{ fontFamily: 'inherit' }}>
              {children}
            </p>
          ),
          mark: ({ children }) => (
            <mark className="bg-yellow-200 px-1 rounded">
              {children}
            </mark>
          ),
          strong: ({ children }) => (
            <strong className="font-bold">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          code: ({ children }) => (
            <code className="bg-gray-100 px-1 rounded">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

interface EditableContentProps {
  editor: Editor | null;
  isEditing: boolean;
  content: string;
  style?: React.CSSProperties;
  placeholder?: string;
  onClick?: () => void;
}

export const EditableContent = memo(function EditableContent({
  editor,
  isEditing,
  content,
  style,
  placeholder,
  onClick
}: EditableContentProps) {
  if (isEditing && editor) {
    return <EditorContent editor={editor} />;
  }

  return (
    <div
      className="cursor-text hover:bg-black/5 rounded px-2 py-1 transition-colors"
      onClick={onClick}
    >
      <MarkdownContent 
        content={content} 
        style={style} 
        placeholder={placeholder}
      />
    </div>
  );
});