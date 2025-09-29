-- Add emoji column to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '';

-- Optional: Add an index for better performance if you plan to filter by emoji
-- CREATE INDEX IF NOT EXISTS idx_notes_emoji ON notes(emoji);

-- Optional: Add a check constraint to ensure emoji is either empty or a valid emoji
-- This is optional but can help with data validation
-- ALTER TABLE notes ADD CONSTRAINT check_emoji_length CHECK (LENGTH(emoji) <= 4);
