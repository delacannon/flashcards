import React, { useState, useCallback, memo } from 'react';
import { FlashcardBase } from './FlashcardBase';
import { EditableContent } from './CardContent';
import { CardActions, DragHandle } from './CardActions';
import { useMarkdownEditor } from '@/hooks/useMarkdownEditor';
import type { Flashcard, FlashcardStyles } from '@/types';
import type { UseSortableReturn } from '@dnd-kit/sortable';

interface EditableFlashcardProps {
  card: Flashcard;
  questionStyles?: FlashcardStyles;
  answerStyles?: FlashcardStyles;
  flipAxis?: 'X' | 'Y';
  onUpdate?: (question: string, answer: string) => void;
  onDelete?: () => void;
  sortable?: Pick<UseSortableReturn, 'attributes' | 'listeners'>;
}

export const EditableFlashcard = memo(function EditableFlashcard({
  card,
  questionStyles = {},
  answerStyles = {},
  flipAxis = 'Y',
  onUpdate,
  onDelete,
  sortable
}: EditableFlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [editingField, setEditingField] = useState<'question' | 'answer' | null>(null);
  const [tempQuestion, setTempQuestion] = useState(card.question);
  const [tempAnswer, setTempAnswer] = useState(card.answer);

  const questionEditor = useMarkdownEditor({
    content: tempQuestion,
    onUpdate: setTempQuestion,
    onBlur: () => handleSave(),
    editable: editingField === 'question',
    placeholder: 'Enter question...',
    styles: {
      color: questionStyles.color,
      fontSize: questionStyles.fontSize,
      fontFamily: questionStyles.fontFamily,
    },
  });

  const answerEditor = useMarkdownEditor({
    content: tempAnswer,
    onUpdate: setTempAnswer,
    onBlur: () => handleSave(),
    editable: editingField === 'answer',
    placeholder: 'Enter answer...',
    styles: {
      color: answerStyles.color,
      fontSize: answerStyles.fontSize,
      fontFamily: answerStyles.fontFamily,
    },
  });

  const handleSave = useCallback(() => {
    if (editingField && onUpdate) {
      onUpdate(tempQuestion, tempAnswer);
    }
    setEditingField(null);
  }, [editingField, onUpdate, tempQuestion, tempAnswer]);

  const handleCancel = useCallback(() => {
    setTempQuestion(card.question);
    setTempAnswer(card.answer);
    questionEditor.setMarkdown(card.question);
    answerEditor.setMarkdown(card.answer);
    setEditingField(null);
  }, [card, questionEditor, answerEditor]);

  const handleEdit = useCallback((field: 'question' | 'answer') => {
    setEditingField(field);
    if (field === 'question') {
      questionEditor.focus('end');
    } else {
      answerEditor.focus('end');
    }
  }, [questionEditor, answerEditor]);

  const dragHandle = sortable && (
    <DragHandle sortable={sortable} />
  );

  const actions = (
    <CardActions
      isEditing={editingField !== null}
      onEdit={() => handleEdit(isFlipped ? 'answer' : 'question')}
      onDelete={onDelete}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );

  const questionContent = (
    <EditableContent
      editor={questionEditor.editor}
      isEditing={editingField === 'question'}
      content={tempQuestion}
      style={{
        color: questionStyles.color,
        fontSize: questionStyles.fontSize,
        fontFamily: questionStyles.fontFamily,
      }}
      placeholder="Enter question..."
      onClick={() => handleEdit('question')}
    />
  );

  const answerContent = (
    <EditableContent
      editor={answerEditor.editor}
      isEditing={editingField === 'answer'}
      content={tempAnswer}
      style={{
        color: answerStyles.color,
        fontSize: answerStyles.fontSize,
        fontFamily: answerStyles.fontFamily,
      }}
      placeholder="Enter answer..."
      onClick={() => handleEdit('answer')}
    />
  );

  return (
    <FlashcardBase
      question={questionContent}
      answer={answerContent}
      isFlipped={isFlipped}
      onFlip={() => !editingField && setIsFlipped(!isFlipped)}
      flipAxis={flipAxis}
      questionStyles={questionStyles}
      answerStyles={answerStyles}
      dragHandle={dragHandle}
      actions={actions}
    />
  );
});