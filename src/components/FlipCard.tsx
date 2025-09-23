import { useState, memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { remarkHighlight } from '@/lib/remarkHighlight';
import './FlipCard.css';

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
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}

export const FlipCard = memo(function FlipCard({ 
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
  onEdit, 
  onDelete, 
  className 
}: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  const handleClick = () => {
    setFlipped(!flipped);
  };

  // Memoize style objects to prevent recreation on every render
  const questionStyles = useMemo(() => ({
    borderStyle: questionBorderStyle === 'none' ? 'none' : questionBorderStyle,
    borderWidth: questionBorderStyle === 'none' ? '0' : questionBorderWidth,
    borderColor: questionBorderColor,
    backgroundColor: questionBgColor || undefined,
    color: questionFgColor || undefined,
    fontSize: questionFontSize || undefined,
    fontFamily: questionFontFamily || undefined
  }), [questionBorderStyle, questionBorderWidth, questionBorderColor, questionBgColor, questionFgColor, questionFontSize, questionFontFamily]);

  const answerStyles = useMemo(() => ({
    borderStyle: answerBorderStyle === 'none' ? 'none' : answerBorderStyle,
    borderWidth: answerBorderStyle === 'none' ? '0' : answerBorderWidth,
    borderColor: answerBorderColor,
    backgroundColor: answerBgColor || undefined,
    color: answerFgColor || undefined,
    fontSize: answerFontSize || undefined,
    fontFamily: answerFontFamily || undefined
  }), [answerBorderStyle, answerBorderWidth, answerBorderColor, answerBgColor, answerFgColor, answerFontSize, answerFontFamily]);

  return (
    <div className={cn('flip-card-container relative group cursor-pointer', className)} onClick={handleClick}>
      <div className={cn('flip-card', flipped && `flipped-${flipAxis.toLowerCase()}`)}>
        {/* Front Face - Question */}
        <div className='flip-card-face flip-card-front'>
          <div 
            className='w-full h-full rounded-xl shadow hover:shadow-lg transition-shadow min-h-[200px] relative overflow-hidden'
            style={questionStyles}
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
          <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20'>
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
        
        {/* Back Face - Answer */}
        <div className={cn('flip-card-face', flipAxis === 'Y' ? 'flip-card-back-y' : 'flip-card-back-x')}>
          <div 
            className='w-full h-full rounded-xl shadow hover:shadow-lg transition-shadow min-h-[200px] relative overflow-hidden'
            style={answerStyles}
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
          <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20'>
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
      </div>
    </div>
  );
});