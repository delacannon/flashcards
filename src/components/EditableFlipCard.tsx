import { useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import { Markdown } from 'tiptap-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { remarkHighlight } from '@/lib/remarkHighlight';

interface EditableFlipCardProps {
  id: string;
  question: string;
  answer: string;
  flipAxis?: 'X' | 'Y';
  questionBgColor?: string;
  questionFgColor?: string;
  questionFontSize?: string;
  questionFontFamily?: string;
  answerBgColor?: string;
  answerFgColor?: string;
  answerFontSize?: string;
  answerFontFamily?: string;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateContent: (id: string, question: string, answer: string) => void;
  className?: string;
}

export function EditableFlipCard({
  id,
  question,
  answer,
  flipAxis = 'Y',
  questionBgColor,
  questionFgColor,
  questionFontSize,
  questionFontFamily,
  answerBgColor,
  answerFgColor,
  answerFontSize,
  answerFontFamily,
  onEdit,
  onDelete,
  onUpdateContent,
  className,
}: EditableFlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);

  const questionEditor = useEditor({
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
    content: question || '',
    editable: isEditingQuestion,
    onBlur: () => {
      const htmlContent = questionEditor?.getHTML() || '';
      // Convert HTML to markdown-like format
      let markdownContent = htmlContent
        .replace(/<p>/g, '')
        .replace(/<\/p>/g, '\n')
        .replace(/<strong>/g, '**')
        .replace(/<\/strong>/g, '**')
        .replace(/<em>/g, '*')
        .replace(/<\/em>/g, '*')
        .replace(/<mark[^>]*>/g, '==')
        .replace(/<\/mark>/g, '==')
        .replace(/<code>/g, '`')
        .replace(/<\/code>/g, '`')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/\n+$/, ''); // Remove trailing newlines

      if (markdownContent !== question) {
        onUpdateContent(id, markdownContent, answer);
      }
      setIsEditingQuestion(false);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm focus:outline-none min-h-[2rem] cursor-text [&_mark]:bg-yellow-200 [&_mark]:px-1 [&_mark]:rounded',
        style: `color: ${questionFgColor || 'inherit'}; font-size: ${
          questionFontSize || '14px'
        }; font-family: ${questionFontFamily || 'inherit'};`,
      },
    },
  });

  const answerEditor = useEditor({
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
    content: answer || '',
    editable: isEditingAnswer,
    onBlur: () => {
      const htmlContent = answerEditor?.getHTML() || '';
      // Convert HTML to markdown-like format
      let markdownContent = htmlContent
        .replace(/<p>/g, '')
        .replace(/<\/p>/g, '\n')
        .replace(/<strong>/g, '**')
        .replace(/<\/strong>/g, '**')
        .replace(/<em>/g, '*')
        .replace(/<\/em>/g, '*')
        .replace(/<mark[^>]*>/g, '==')
        .replace(/<\/mark>/g, '==')
        .replace(/<code>/g, '`')
        .replace(/<\/code>/g, '`')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/\n+$/, ''); // Remove trailing newlines

      if (markdownContent !== answer) {
        onUpdateContent(id, question, markdownContent);
      }
      setIsEditingAnswer(false);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm focus:outline-none min-h-[2rem] cursor-text [&_mark]:bg-yellow-200 [&_mark]:px-1 [&_mark]:rounded',
        style: `color: ${answerFgColor || 'inherit'}; font-size: ${
          answerFontSize || '14px'
        }; font-family: ${answerFontFamily || 'inherit'};`,
      },
    },
  });

  useEffect(() => {
    if (questionEditor) {
      questionEditor.setEditable(isEditingQuestion);
      if (isEditingQuestion) {
        questionEditor.commands.focus('end');
      }
    }
  }, [isEditingQuestion, questionEditor]);

  useEffect(() => {
    if (answerEditor) {
      answerEditor.setEditable(isEditingAnswer);
      if (isEditingAnswer) {
        answerEditor.commands.focus('end');
      }
    }
  }, [isEditingAnswer, answerEditor]);

  useEffect(() => {
    if (questionEditor) {
      const currentHtml = questionEditor.getHTML();
      const currentMarkdown = currentHtml
        .replace(/<p>/g, '')
        .replace(/<\/p>/g, '\n')
        .replace(/<strong>/g, '**')
        .replace(/<\/strong>/g, '**')
        .replace(/<em>/g, '*')
        .replace(/<\/em>/g, '*')
        .replace(/<mark[^>]*>/g, '==')
        .replace(/<\/mark>/g, '==')
        .replace(/<code>/g, '`')
        .replace(/<\/code>/g, '`')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/\n+$/, '');

      if (question && question !== currentMarkdown) {
        // Parse markdown to HTML for Tiptap
        const htmlContent = question
          .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/==(.*?)==/g, '<mark>$1</mark>')
          .replace(/`([^`]+)`/g, '<code>$1</code>')
          .replace(/\n/g, '</p><p>');

        questionEditor.commands.setContent(`<p>${htmlContent}</p>`);
      }
    }
  }, [question]);

  useEffect(() => {
    if (answerEditor) {
      const currentHtml = answerEditor.getHTML();
      const currentMarkdown = currentHtml
        .replace(/<p>/g, '')
        .replace(/<\/p>/g, '\n')
        .replace(/<strong>/g, '**')
        .replace(/<\/strong>/g, '**')
        .replace(/<em>/g, '*')
        .replace(/<\/em>/g, '*')
        .replace(/<mark[^>]*>/g, '==')
        .replace(/<\/mark>/g, '==')
        .replace(/<code>/g, '`')
        .replace(/<\/code>/g, '`')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/\n+$/, '');

      if (answer && answer !== currentMarkdown) {
        // Parse markdown to HTML for Tiptap
        const htmlContent = answer
          .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/==(.*?)==/g, '<mark>$1</mark>')
          .replace(/`([^`]+)`/g, '<code>$1</code>')
          .replace(/\n/g, '</p><p>');

        answerEditor.commands.setContent(`<p>${htmlContent}</p>`);
      }
    }
  }, [answer]);

  const { transform, opacity } = useSpring({
    opacity: flipped ? 1 : 0,
    transform: `perspective(600px) rotate${flipAxis}(${flipped ? 180 : 0}deg)`,
    config: { mass: 5, tension: 500, friction: 80 },
  });

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't flip if clicking on text content or buttons
    const target = e.target as HTMLElement;
    if (
      target.closest('.editable-content') ||
      target.closest('button') ||
      isEditingQuestion ||
      isEditingAnswer
    ) {
      return;
    }
    setFlipped(!flipped);
  };

  const handleQuestionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditingQuestion) {
      setIsEditingQuestion(true);
    }
  };

  const handleAnswerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditingAnswer) {
      setIsEditingAnswer(true);
    }
  };

  return (
    <div
      className={cn('relative group cursor-pointer', className)}
      onClick={handleCardClick}
    >
      <animated.div
        className='absolute w-full h-full'
        style={{
          opacity: opacity.to((o) => 1 - o),
          transform,
          backfaceVisibility: 'hidden',
        }}
      >
        <div
          className={cn(
            'w-full h-full rounded-xl border shadow hover:shadow-lg transition-shadow min-h-[200px]',
            isEditingQuestion && 'ring-2 ring-primary ring-offset-2'
          )}
          style={{
            backgroundColor: questionBgColor || undefined,
            color: questionFgColor || undefined,
            fontFamily: questionFontFamily || undefined,
          }}
        >
          <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10'>
            <Button
              size='icon'
              variant='ghost'
              className='h-8 w-8'
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit2 className='h-4 w-4' />
            </Button>
            <Button
              size='icon'
              variant='ghost'
              className='h-8 w-8'
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
          <div className='flex h-full min-h-[200px] items-center justify-center p-6'>
            <div className='text-center w-full'>
              <div className='editable-content' onClick={handleQuestionClick}>
                {isEditingQuestion ? (
                  <EditorContent editor={questionEditor} />
                ) : (
                  <div
                    className='font-medium cursor-text hover:bg-black/5 rounded px-2 py-1 transition-colors prose prose-sm max-w-none'
                    style={{
                      fontSize: questionFontSize || '14px',
                      fontFamily: questionFontFamily || 'inherit',
                      color: questionFgColor || 'inherit',
                    }}
                  >
                    {question ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkHighlight]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          p: ({ children }) => (
                            <p
                              className='m-0'
                              style={{ fontFamily: 'inherit' }}
                            >
                              {children}
                            </p>
                          ),
                          mark: ({ children }) => (
                            <mark className='bg-yellow-200 px-1 rounded'>
                              {children}
                            </mark>
                          ),
                          strong: ({ children }) => (
                            <strong className='font-bold'>{children}</strong>
                          ),
                          em: ({ children }) => (
                            <em className='italic'>{children}</em>
                          ),
                          code: ({ children }) => (
                            <code className='bg-gray-100 px-1 rounded'>
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {question}
                      </ReactMarkdown>
                    ) : (
                      <p className='m-0 opacity-50'>Click to add question</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </animated.div>

      <animated.div
        className='w-full h-full'
        style={{
          opacity,
          transform,
          ...(flipAxis === 'Y' ? { rotateY: '180deg' } : { rotateX: '180deg' }),
          backfaceVisibility: 'hidden',
        }}
      >
        <div
          className={cn(
            'w-full h-full rounded-xl border shadow hover:shadow-lg transition-shadow min-h-[200px]',
            isEditingAnswer && 'ring-2 ring-primary ring-offset-2'
          )}
          style={{
            backgroundColor: answerBgColor || undefined,
            color: answerFgColor || undefined,
            fontFamily: answerFontFamily || undefined,
          }}
        >
          <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10'>
            <Button
              size='icon'
              variant='ghost'
              className='h-8 w-8'
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit2 className='h-4 w-4' />
            </Button>
            <Button
              size='icon'
              variant='ghost'
              className='h-8 w-8'
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
          <div className='flex h-full min-h-[200px] items-center justify-center p-6'>
            <div className='text-center w-full'>
              <div className='editable-content' onClick={handleAnswerClick}>
                {isEditingAnswer ? (
                  <EditorContent editor={answerEditor} />
                ) : (
                  <div
                    className='cursor-text hover:bg-black/5 rounded px-2 py-1 transition-colors prose prose-sm max-w-none'
                    style={{
                      fontSize: answerFontSize || '14px',
                      fontFamily: answerFontFamily || 'inherit',
                      color: answerFgColor || 'inherit',
                    }}
                  >
                    {answer ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkHighlight]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          p: ({ children }) => (
                            <p
                              className='m-0'
                              style={{ fontFamily: 'inherit' }}
                            >
                              {children}
                            </p>
                          ),
                          mark: ({ children }) => (
                            <mark className='bg-yellow-200 px-1 rounded'>
                              {children}
                            </mark>
                          ),
                          strong: ({ children }) => (
                            <strong className='font-bold'>{children}</strong>
                          ),
                          em: ({ children }) => (
                            <em className='italic'>{children}</em>
                          ),
                          code: ({ children }) => (
                            <code className='bg-gray-100 px-1 rounded'>
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {answer}
                      </ReactMarkdown>
                    ) : (
                      <p className='m-0 opacity-50'>Click to add answer</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </animated.div>
    </div>
  );
}
