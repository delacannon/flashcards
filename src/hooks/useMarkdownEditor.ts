import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import { Markdown } from 'tiptap-markdown';
import { useCallback, useEffect } from 'react';

interface UseMarkdownEditorOptions {
  content: string;
  onUpdate?: (content: string) => void;
  onBlur?: (content: string) => void;
  editable?: boolean;
  placeholder?: string;
  styles?: {
    color?: string;
    fontSize?: string;
    fontFamily?: string;
  };
}

interface MarkdownStorage {
  markdown?: {
    getMarkdown: () => string;
  };
}

export function useMarkdownEditor({
  content,
  onUpdate,
  onBlur,
  editable = true,
  placeholder = 'Start typing...',
  styles = {},
}: UseMarkdownEditorOptions) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Highlight.configure({
        multicolor: false,
      }),
      Typography,
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
        bulletListMarker: '-',
        linkify: true,
      }),
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none min-h-[2rem] cursor-text [&_mark]:bg-yellow-200 [&_mark]:px-1 [&_mark]:rounded',
        style: `color: ${styles.color || 'inherit'}; font-size: ${
          styles.fontSize || '14px'
        }; font-family: ${styles.fontFamily || 'inherit'};`,
      },
      handleDOMEvents: {
        blur: () => {
          if (onBlur) {
            const markdownContent = (editor?.storage as MarkdownStorage).markdown?.getMarkdown() || '';
            onBlur(markdownContent);
          }
          return false;
        },
      },
    },
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        const markdownContent = (editor.storage as MarkdownStorage).markdown?.getMarkdown() || '';
        onUpdate(markdownContent);
      }
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== (editor.storage as MarkdownStorage).markdown?.getMarkdown()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
      if (editable) {
        editor.commands.focus('end');
      }
    }
  }, [editable, editor]);

  const getMarkdown = useCallback(() => {
    return (editor?.storage as MarkdownStorage).markdown?.getMarkdown() || '';
  }, [editor]);

  const setMarkdown = useCallback((markdown: string) => {
    editor?.commands.setContent(markdown);
  }, [editor]);

  const clear = useCallback(() => {
    editor?.commands.clearContent();
  }, [editor]);

  const focus = useCallback((position?: 'start' | 'end') => {
    editor?.commands.focus(position);
  }, [editor]);

  return {
    editor,
    getMarkdown,
    setMarkdown,
    clear,
    focus,
    isEmpty: !editor?.getText().trim(),
  };
}