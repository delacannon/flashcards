import { useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { remarkHighlight } from '@/lib/remarkHighlight';

interface FlipCardProps {
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
  className?: string;
}

export function FlipCard({ 
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
  className 
}: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  const { transform, opacity } = useSpring({
    opacity: flipped ? 1 : 0,
    transform: `perspective(600px) rotate${flipAxis}(${flipped ? 180 : 0}deg)`,
    config: { mass: 5, tension: 500, friction: 80 },
  });

  const handleClick = () => {
    setFlipped(!flipped);
  };

  return (
    <div className={cn('relative group cursor-pointer', className)} onClick={handleClick}>
      <animated.div
        className='absolute w-full h-full'
        style={{
          opacity: opacity.to(o => 1 - o),
          transform,
          backfaceVisibility: 'hidden',
        }}
      >
        <div 
          className='w-full h-full rounded-xl border shadow hover:shadow-lg transition-shadow min-h-[200px]'
          style={{
            backgroundColor: questionBgColor || undefined,
            color: questionFgColor || undefined,
            fontSize: questionFontSize || undefined,
            fontFamily: questionFontFamily || undefined
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
              <p className='text-xs opacity-70 mb-2'>Question</p>
              <div 
                className='font-medium prose prose-sm max-w-none' 
                style={{ 
                  fontSize: questionFontSize || '14px',
                  fontFamily: questionFontFamily || 'inherit',
                  color: questionFgColor || 'inherit'
                }}
              >
                {question ? (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkHighlight]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      p: ({ children }) => <p className="m-0" style={{ fontFamily: 'inherit' }}>{children}</p>,
                      mark: ({ children }) => <mark className="bg-yellow-200 px-1 rounded">{children}</mark>,
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ children }) => <code className="bg-gray-100 px-1 rounded">{children}</code>,
                    }}
                  >
                    {question}
                  </ReactMarkdown>
                ) : (
                  <p className="m-0 opacity-50">No question yet</p>
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
          className='w-full h-full rounded-xl border shadow hover:shadow-lg transition-shadow min-h-[200px]'
          style={{
            backgroundColor: answerBgColor || undefined,
            color: answerFgColor || undefined,
            fontSize: answerFontSize || undefined,
            fontFamily: answerFontFamily || undefined
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
              <p className='text-xs opacity-70 mb-2'>Answer</p>
              <div 
                className='prose prose-sm max-w-none' 
                style={{ 
                  fontSize: answerFontSize || '14px',
                  fontFamily: answerFontFamily || 'inherit',
                  color: answerFgColor || 'inherit'
                }}
              >
                {answer ? (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkHighlight]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      p: ({ children }) => <p className="m-0" style={{ fontFamily: 'inherit' }}>{children}</p>,
                      mark: ({ children }) => <mark className="bg-yellow-200 px-1 rounded">{children}</mark>,
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ children }) => <code className="bg-gray-100 px-1 rounded">{children}</code>,
                    }}
                  >
                    {answer}
                  </ReactMarkdown>
                ) : (
                  <p className="m-0 opacity-50">No answer yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </animated.div>
    </div>
  );
}