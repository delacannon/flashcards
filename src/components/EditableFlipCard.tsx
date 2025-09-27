import { useState, useEffect, memo } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, RefreshCw } from 'lucide-react';
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
import { getPatternById } from '@/lib/patterns';

interface MarkdownStorage {
  markdown?: {
    getMarkdown: () => string;
  };
}

interface EditableFlipCardProps {
  id: string;
  question: string;
  answer: string;
  flipAxis?: 'X' | 'Y';
  questionBgColor?: string;
  questionFgColor?: string;
  questionFontSize?: string;
  questionFontFamily?: string;
  questionBackgroundPattern?: string;
  answerBgColor?: string;
  answerFgColor?: string;
  answerFontSize?: string;
  answerFontFamily?: string;
  answerBackgroundPattern?: string;
  // Question side background
  questionBackgroundImage?: string;
  questionBackgroundImageOpacity?: number;
  // Answer side background
  answerBackgroundImage?: string;
  answerBackgroundImageOpacity?: number;
  // Legacy support
  backgroundImage?: string;
  backgroundImageOpacity?: number;
  // Border styles for question side
  questionBorderStyle?: string;
  questionBorderWidth?: string;
  questionBorderColor?: string;
  // Border styles for answer side
  answerBorderStyle?: string;
  answerBorderWidth?: string;
  answerBorderColor?: string;
  autoFlip?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  onUpdateContent: (id: string, question: string, answer: string) => void;
  className?: string;
  dragHandle?: React.ReactNode;
}

export const EditableFlipCard = memo(function EditableFlipCard({
  id,
  question,
  answer,
  flipAxis = 'Y',
  questionBgColor,
  questionFgColor,
  questionFontSize,
  questionFontFamily,
  questionBackgroundPattern,
  answerBgColor,
  answerFgColor,
  answerFontSize,
  answerFontFamily,
  answerBackgroundPattern,
  questionBackgroundImage,
  questionBackgroundImageOpacity,
  answerBackgroundImage,
  answerBackgroundImageOpacity,
  backgroundImage,
  backgroundImageOpacity = 0.3,
  questionBorderStyle = 'solid',
  questionBorderWidth = '1px',
  questionBorderColor = '#e5e7eb',
  answerBorderStyle = 'solid',
  answerBorderWidth = '1px',
  answerBorderColor = '#e5e7eb',
  autoFlip = false,
  onEdit,
  onDelete,
  onRegenerate,
  isRegenerating = false,
  onUpdateContent,
  className,
  dragHandle,
}: EditableFlipCardProps) {
  const [flipped, setFlipped] = useState(autoFlip);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);
  
  // Auto-flip when autoFlip prop changes
  useEffect(() => {
    setFlipped(autoFlip);
  }, [autoFlip]);

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
      const markdownContent = (questionEditor?.storage as MarkdownStorage).markdown?.getMarkdown() || '';
      if (markdownContent !== question) {
        onUpdateContent(id, markdownContent, answer);
      }
      setIsEditingQuestion(false);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm focus:outline-none min-h-[2rem] cursor-text [&_mark]:bg-yellow-200 [&_mark]:px-1 [&_mark]:rounded hover:border-2 hover:border-red-500 hover:rounded-lg transition-all duration-200 p-2 -m-2',
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
      const markdownContent = (answerEditor?.storage as MarkdownStorage).markdown?.getMarkdown() || '';
      if (markdownContent !== answer) {
        onUpdateContent(id, question, markdownContent);
      }
      setIsEditingAnswer(false);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm focus:outline-none min-h-[2rem] cursor-text [&_mark]:bg-yellow-200 [&_mark]:px-1 [&_mark]:rounded hover:border-2 hover:border-red-500 hover:rounded-lg transition-all duration-200 p-2 -m-2',
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
      const currentMarkdown = (questionEditor.storage as MarkdownStorage).markdown?.getMarkdown() || '';
      if (question && question !== currentMarkdown) {
        questionEditor.commands.setContent(question);
      }
    }
  }, [question, questionEditor]);

  useEffect(() => {
    if (answerEditor) {
      const currentMarkdown = (answerEditor.storage as MarkdownStorage).markdown?.getMarkdown() || '';
      if (answer && answer !== currentMarkdown) {
        answerEditor.commands.setContent(answer);
      }
    }
  }, [answer, answerEditor]);

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
            'w-full h-full rounded-xl shadow hover:shadow-lg transition-shadow min-h-[200px] relative overflow-hidden',
            isEditingQuestion && 'ring-2 ring-primary ring-offset-2',
            isRegenerating && 'opacity-60'
          )}
          style={{
            borderStyle: questionBorderStyle === 'none' ? 'none' : questionBorderStyle,
            borderWidth: questionBorderStyle === 'none' ? '0' : questionBorderWidth,
            borderColor: questionBorderColor,
            ...(questionBackgroundPattern && questionBackgroundPattern !== 'none'
              ? getPatternById(questionBackgroundPattern)?.getCSS(questionBgColor || '#ffffff')
              : { backgroundColor: questionBgColor || undefined }),
            color: questionFgColor || undefined,
            fontFamily: questionFontFamily || undefined,
          }}
        >
          {/* Background Image */}
          {(questionBackgroundImage || backgroundImage) && (
            <div
              className='absolute inset-0 z-0'
              style={{
                backgroundImage: `url(${questionBackgroundImage || backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: questionBackgroundImageOpacity !== undefined ? questionBackgroundImageOpacity : backgroundImageOpacity,
              }}
            />
          )}
          {/* Drag Handle - only on front side */}
          {dragHandle && (
            <div className='absolute top-2 left-2 z-20'>
              {dragHandle}
            </div>
          )}
          <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20'>
            {onRegenerate && (
              <Button
                size='icon'
                variant='ghost'
                className='h-8 w-8'
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate();
                }}
                disabled={isRegenerating}
                title='Regenerate with AI'
              >
                <RefreshCw className={cn('h-4 w-4', isRegenerating && 'animate-spin')} />
              </Button>
            )}
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
          <div className='flex h-full min-h-[200px] items-center justify-center p-6 relative z-10'>
            <div className='text-center w-full'>
              <div className='editable-content' onClick={handleQuestionClick}>
                {isEditingQuestion ? (
                  <EditorContent editor={questionEditor} />
                ) : (
                  <div
                    className='font-medium cursor-text hover:bg-black/5 hover:border-2 hover:border-red-500 hover:rounded-lg rounded px-2 py-1 transition-all duration-200 prose prose-sm max-w-none border-2 border-transparent'
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
            'w-full h-full rounded-xl shadow hover:shadow-lg transition-shadow min-h-[200px] relative overflow-hidden',
            isEditingAnswer && 'ring-2 ring-primary ring-offset-2'
          )}
          style={{
            borderStyle: answerBorderStyle === 'none' ? 'none' : answerBorderStyle,
            borderWidth: answerBorderStyle === 'none' ? '0' : answerBorderWidth,
            borderColor: answerBorderColor,
            ...(answerBackgroundPattern && answerBackgroundPattern !== 'none'
              ? getPatternById(answerBackgroundPattern)?.getCSS(answerBgColor || '#f3f4f6')
              : { backgroundColor: answerBgColor || undefined }),
            color: answerFgColor || undefined,
            fontFamily: answerFontFamily || undefined,
          }}
        >
          {/* Background Image */}
          {(answerBackgroundImage || backgroundImage) && (
            <div
              className='absolute inset-0 z-0'
              style={{
                backgroundImage: `url(${answerBackgroundImage || backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: answerBackgroundImageOpacity !== undefined ? answerBackgroundImageOpacity : backgroundImageOpacity,
              }}
            />
          )}
          {/* Drag Handle - also on answer side */}
          {dragHandle && (
            <div className='absolute top-2 left-2 z-20'>
              {dragHandle}
            </div>
          )}
          <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20'>
            {onRegenerate && (
              <Button
                size='icon'
                variant='ghost'
                className='h-8 w-8'
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate();
                }}
                disabled={isRegenerating}
                title='Regenerate with AI'
              >
                <RefreshCw className={cn('h-4 w-4', isRegenerating && 'animate-spin')} />
              </Button>
            )}
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
          <div className='flex h-full min-h-[200px] items-center justify-center p-6 relative z-10'>
            <div className='text-center w-full'>
              <div className='editable-content' onClick={handleAnswerClick}>
                {isEditingAnswer ? (
                  <EditorContent editor={answerEditor} />
                ) : (
                  <div
                    className='cursor-text hover:bg-black/5 hover:border-2 hover:border-red-500 hover:rounded-lg rounded px-2 py-1 transition-all duration-200 prose prose-sm max-w-none border-2 border-transparent'
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
});
