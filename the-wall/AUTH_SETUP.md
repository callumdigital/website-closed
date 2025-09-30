# Authentication Setup Guide

## Overview
The Wall now has a complete authentication system with role-based access control using Supabase Auth.

## User Roles

1. **Owner** - Full access, can create/manage users and all features
2. **Admin** - Can manage projects, notes, and settings
3. **Viewer** - Read-only access to projects and notes

## Setup Steps

### 1. Run Database Migration

Go to your Supabase project dashboard → SQL Editor and run the `create_user_profiles.sql` file.

This will:
- Create the `user_profiles` table
- Set up Row Level Security (RLS) policies
- Create automatic triggers for new user signups
- Set default role as "viewer" for new accounts

### 2. Create Your Owner Account

After running the migration:

1. Start your local dev server: `npm run dev`
2. Go to `/login` and create a new account
3. Go to Supabase dashboard → Authentication → Users
4. Find your user ID
5. Go to SQL Editor and run:

```sql
INSERT INTO public.user_profiles (user_id, role, display_name)
VALUES (
  'YOUR-USER-ID-HERE',
  'owner',
  'Your Name'
)
ON CONFLICT (user_id) DO UPDATE SET role = 'owner';
```

Or update the comment in `create_user_profiles.sql` with your email and run that INSERT statement.

### 3. Test Authentication

1. Go to `/login` - You should see the login page
2. Sign in with your owner account
3. You'll be redirected to `/admin`
4. You should see a "👥 Users" button in the header (owner only)
5. Click it to access User Management

## Features Implemented

### Authentication
- ✅ Email/password signup and login
- ✅ Password reset functionality
- ✅ Persistent sessions
- ✅ Sign out

### Authorization
- ✅ Protected routes (must be logged in to access `/admin`)
- ✅ Role-based permissions
- ✅ Automatic role checking on page load

### User Management (Owner Only)
- ✅ View all users
- ✅ Invite new users with specific roles
- ✅ Change user roles
- ✅ Delete users
- ✅ Visual role badges

### UI Updates
- ✅ User profile display in header (name + role)
- ✅ Sign out button
- ✅ User management modal
- ✅ Access denied page for insufficient permissions
- ✅ Loading states for auth checks

## File Structure

```
the-wall/
├── src/
│   ├── services/
│   │   └── authService.jsx         # Authentication & user profile services
│   ├── pages/
│   │   ├── LoginPage.jsx          # Login/signup/password reset page
│   │   └── AdminPage.jsx          # Updated with auth integration
│   ├── components/
│   │   ├── ProtectedRoute.jsx     # Route wrapper for auth
│   │   └── UserManagement.jsx     # User management interface
│   └── App.jsx                    # Updated with protected routes
└── create_user_profiles.sql        # Database migration
```

## Routes

- `/login` - Public login/signup page
- `/admin` - Protected admin panel (requires authentication + viewer role or higher)
- `/:projectId` - Public form page (no auth required)
- `/:projectId/display` - Public display board (no auth required)

## Permissions Matrix

| Action | Owner | Admin | Viewer |
|--------|-------|-------|--------|
| View projects | ✅ | ✅ | ✅ |
| Create projects | ✅ | ✅ | ❌ |
| Manage notes | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ |

## Testing Locally

1. Make sure Supabase is configured:
   - `VITE_SUPABASE_URL` in your `.env`
   - `VITE_SUPABASE_ANON_KEY` in your `.env`

2. Run the dev server:
   ```bash
   cd the-wall
   npm run dev
   ```

3. Test the flow:
   - Visit `http://localhost:3001/login`
   - Create an account
   - Set your role to "owner" in Supabase
   - Log in and test features

## Production Deployment Notes

- The anon key is safe to expose (protected by RLS)
- Make sure to set your owner account before deploying
- Consider disabling public signup after initial setup if you want invite-only
- Email confirmation is handled by Supabase (configure in Supabase dashboard)

## Security Features

- ✅ Row Level Security (RLS) on user_profiles table
- ✅ Secure password hashing (handled by Supabase)
- ✅ Session-based authentication
- ✅ Role-based access control
- ✅ Owner-only user management
- ✅ Protected API endpoints via RLS

## Troubleshooting

### "No role assigned" error
- Make sure you ran the SQL migration
- Check if your user has an entry in `user_profiles` table

### Can't access admin page
- Make sure you're logged in
- Check your role in the `user_profiles` table
- Try signing out and back in

### User management not showing
- Only owners can see the "👥 Users" button
- Check your role is set to 'owner' in the database
