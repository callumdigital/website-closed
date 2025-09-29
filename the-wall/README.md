# The Wall

A lightweight digital sticky-note wall for capturing student or workshop feedback in real time. Posts appear as colourful notes in a flowing layout, with minimal barriers to entry.

## Features

- **Anonymous or simple logins** - Minimal barriers to entry
- **Real-time updates** - See notes appear instantly on the display board
- **Project-based organization** - Each wall can be for a specific project/workshop
- **Admin management** - Approve/reject notes before they go live
- **Responsive design** - Works on mobile and desktop
- **Custom URLs** - Easy sharing with `callum.digital/the-wall/project-name`

## Tech Stack

- **Frontend**: React 19 + Vite
- **Backend**: Supabase (PostgreSQL + Real-time + Auth)
- **Deployment**: Vercel
- **Styling**: Tailwind CSS

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase**:
   - Create a new Supabase project
   - Copy the project URL and anon key
   - Create a `.env` file from `env.example` and add your keys

3. **Set up the database**:
   ```sql
   -- Create projects table
   CREATE TABLE projects (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT,
     status TEXT DEFAULT 'active',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create notes table
   CREATE TABLE notes (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     project_id TEXT REFERENCES projects(id),
     text TEXT NOT NULL,
     color TEXT DEFAULT 'yellow',
     status TEXT DEFAULT 'pending', -- pending, approved, rejected
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable real-time for notes
   ALTER PUBLICATION supabase_realtime ADD TABLE notes;
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## Usage

### For Participants
- Visit `/the-wall/project-name` to add notes
- Visit `/the-wall/project-name/display` to view the live wall

### For Admins
- Visit `/the-wall/admin` to manage projects and approve notes

## Deployment

The project is configured to deploy to Vercel with the base path `/the-wall/`. This allows it to be hosted at `callum.digital/the-wall/` while keeping the main website intact.

## Project Structure

```
the-wall/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components (Form, Display, Admin)
│   ├── services/      # Supabase client and API services
│   ├── App.jsx        # Main app with routing
│   └── main.jsx       # React entry point
├── index.html         # HTML template
├── package.json       # Dependencies
└── vite.config.mjs    # Vite configuration
```


