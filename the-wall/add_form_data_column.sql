-- Add form_data column to notes table for storing complete form submission data
-- This allows us to store all form fields (email, select, additional text fields, etc.)
-- not just the text/emoji/color that are displayed on the wall

ALTER TABLE notes ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT NULL;

-- Example form_data structure:
-- {
--   "main-note": "This is the note text",
--   "emoji": "😊",
--   "color": "yellow",
--   "email": "user@example.com",
--   "department": "Engineering",
--   "feedback-type": "Bug Report"
-- }

-- Add comment for documentation
COMMENT ON COLUMN notes.form_data IS 
  'JSON object containing all form field values submitted by the user. Includes text, emoji, color, and any additional custom fields (email, select, etc.)';

-- Optional: Add an index for querying form data (if you need to search/filter by form field values)
-- CREATE INDEX IF NOT EXISTS idx_notes_form_data ON notes USING GIN (form_data);

