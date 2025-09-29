-- Add titleQuestion as a separate column to projects table
-- This moves titleQuestion out of the branding JSONB field

-- Step 1: Add the new column
ALTER TABLE projects ADD COLUMN title_question TEXT DEFAULT '';

-- Step 2: (Optional) Migrate existing data from branding JSONB to the new column
-- This will extract any existing titleQuestion from the branding field
UPDATE projects 
SET title_question = COALESCE(branding->>'titleQuestion', '')
WHERE branding ? 'titleQuestion';

-- Step 3: (Optional) Remove titleQuestion from existing branding JSONB fields
-- This cleans up the branding field by removing the titleQuestion property
UPDATE projects 
SET branding = branding - 'titleQuestion'
WHERE branding ? 'titleQuestion';

-- To verify the changes:
-- SELECT id, name, title_question, branding FROM projects;
