-- Add form_config column to projects table for storing form builder configuration
ALTER TABLE projects ADD COLUMN IF NOT EXISTS form_config JSONB DEFAULT NULL;

-- Example form_config data structure:
-- {
--   "title": "The Wall",
--   "subtitle": "Share your thoughts and ideas",
--   "buttonText": "Submit",
--   "successTitle": "Thank you!",
--   "successMessage": "Your submission has been received.",
--   "showCharacterCount": true,
--   "allowMultipleSubmissions": true,
--   "fields": [
--     {
--       "id": "main-note",
--       "type": "textarea",
--       "label": "What's on your mind?",
--       "placeholder": "Write your note here...",
--       "required": true,
--       "maxLength": 280,
--       "showCharacterCount": true
--     },
--     {
--       "id": "emoji",
--       "type": "emoji",
--       "label": "Choose an Emoji",
--       "required": false
--     },
--     {
--       "id": "color",
--       "type": "color",
--       "label": "Choose a Color",
--       "required": false
--     }
--   ]
-- }

-- Add updated_at trigger if not exists
-- This ensures updated_at is automatically set when form_config changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for projects table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_projects_updated_at'
    ) THEN
        CREATE TRIGGER update_projects_updated_at
        BEFORE UPDATE ON projects
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

COMMENT ON COLUMN projects.form_config IS 'JSON configuration for the project form builder, including fields, validation, and display settings';

