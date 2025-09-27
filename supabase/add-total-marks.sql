-- Add total_marks column to flashcard_sets table
-- This will be used to calculate point values for each card in exercises

ALTER TABLE flashcard_sets 
ADD COLUMN total_marks INTEGER DEFAULT 5;

-- Add check constraint to ensure total_marks is positive
ALTER TABLE flashcard_sets 
ADD CONSTRAINT check_total_marks_positive 
CHECK (total_marks IS NULL OR total_marks > 0);

-- Update existing sets to have a default value of 5 marks
UPDATE flashcard_sets 
SET total_marks = 5 
WHERE total_marks IS NULL;

-- Add comment to column for documentation
COMMENT ON COLUMN flashcard_sets.total_marks IS 'Total marks/points for the flashcard set. Each card value is calculated as total_marks / number_of_cards';