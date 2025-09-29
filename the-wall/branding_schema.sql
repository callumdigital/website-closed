-- Add branding columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}';

-- Example branding data structure
-- {
--   "primaryColor": "#3B82F6",
--   "secondaryColor": "#64748B", 
--   "backgroundColor": "#F8FAFC",
--   "fontFamily": "Inter",
--   "logoUrl": "https://example.com/logo.png",
--   "noteColors": ["yellow", "blue", "pink", "green"],
--   "customCSS": ".custom { color: red; }"
-- }
