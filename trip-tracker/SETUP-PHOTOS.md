# Setting up daily photo uploads

About 20 minutes, once. You'll end up with a private page (`upload.html`) where Annalisa & Mitchell sign in by email and post a photo for the day. It shows up on the map within a few minutes.

## 1. Make a Supabase project
1. Go to **supabase.com** and sign up (free).
2. Click **New project**. Name it `trip-tracker`, make up a database password (you won't need it again), pick any region, and click **Create**.
3. Wait about 2 minutes while it sets up.

## 2. Run the setup script
1. In the project, open **SQL Editor** → **New query**.
2. Open `supabase/setup.sql` from this project, copy all of it, and paste it in.
3. **Change the two example emails** near the top to Annalisa's and Mitchell's real emails.
4. Click **Run**. You should see "Success".

## 3. Allow the sign-in link back to your site
1. Open **Authentication** → **URL Configuration**.
2. **Site URL**: your site's address, e.g. `https://yourname.github.io/trip-tracker/`
3. Under **Redirect URLs**, click **Add URL** and add: `https://yourname.github.io/trip-tracker/upload.html`

## 3b. Create the uploaders' accounts
So they get a **Magic Link** email (not "Confirm your email address"), and so only they can request links:
1. **Authentication** → **Users** → **Add user** → **Create new user**.
2. Enter their email, make up any password (it's never used), and tick **Auto Confirm User**.
3. Repeat for each person on the uploaders list (including you, for testing).

## 4. Connect the site
1. Open **Project Settings** → **API Keys** (or **API**). Copy the **Project URL** and the **publishable** key (older projects call it the **anon public** key). Don't copy the secret or service_role key.
2. In `src/data/trip.js`, fill them in:
   ```js
   photos: { supabaseUrl: 'https://abcdefgh.supabase.co', supabaseKey: 'sb_publishable_…' },
   ```
3. Commit and push.

## 5. Send the travellers the link
Send them `https://yourname.github.io/trip-tracker/upload.html`. On their phone:
1. Enter their email, then tap the link in the email that arrives. They stay signed in on that phone.
2. Tap **Share → Add to Home Screen** so it works like an app.

## Good to know
- **Test it before they leave.** Add your own email in step 2 (re-run the script with it added), post a test photo, then delete it from the upload page.
- **Sign-in emails are limited** to a few per hour on Supabase's free email service. Fine for two people signing in once each, but don't spam the button.
- **Free projects pause after about a week with no activity.** Visits to the site count, so this is only a risk before the trip. Open the site once before they fly to be safe.
- **Photos are public.** Anyone with the site link can see them.
- **To add another uploader later**, add their email to the list in `supabase/setup.sql`, run it again, and create their account (step 3b).
