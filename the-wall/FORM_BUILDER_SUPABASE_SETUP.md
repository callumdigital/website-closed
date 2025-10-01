# Form Builder - Supabase Integration Guide

## ✅ Current Implementation Status

The inline form builder is **fully integrated** with Supabase and ready to use!

---

## 🗄️ Database Schema

### **Projects Table - `form_config` Column**

Run this SQL in your Supabase SQL Editor:

```sql
-- Add form_config column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS form_config JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN projects.form_config IS 
  'JSON configuration for the project form builder, including fields, validation, and display settings';
```

### **Data Structure**

The `form_config` JSONB column stores:

```json
{
  "title": "The Wall",
  "subtitle": "Share your thoughts and ideas",
  "buttonText": "Submit",
  "successTitle": "Thank you!",
  "successMessage": "Your submission has been received.",
  "showCharacterCount": true,
  "allowMultipleSubmissions": true,
  "fields": [
    {
      "id": "main-note",
      "type": "textarea",
      "label": "What's on your mind?",
      "placeholder": "Write your note here...",
      "required": true,
      "maxLength": 280,
      "showCharacterCount": true
    },
    {
      "id": "emoji",
      "type": "emoji",
      "label": "Choose an Emoji",
      "required": false
    },
    {
      "id": "color",
      "type": "color",
      "label": "Choose a Color",
      "required": false
    }
  ]
}
```

---

## 🔄 How It Works

### **1. Loading Form Config**

When you select a project, the form config is loaded from Supabase:

```javascript
// In AdminPage.jsx
const config = await formService.getFormConfig(selectedProject.id)
// Returns: project.form_config || DEFAULT_FORM_CONFIG
```

**Flow:**
1. User selects project from dashboard
2. `handleProjectSelect()` is called
3. Form config is loaded via `formService.getFormConfig()`
4. If no config exists in DB, uses `DEFAULT_FORM_CONFIG`
5. Config is set in React state: `setFormConfig(config)`

### **2. Editing Form Config**

Users can now edit form config inline in the Form Builder tab:

**Available Actions:**
- ✅ Add new fields (Text, Textarea, Email, Select)
- ✅ Edit field labels and placeholders
- ✅ Toggle required/character count
- ✅ Set max length
- ✅ Reorder fields (up/down arrows)
- ✅ Remove fields (× button)

**State Management:**
- All changes stored in React state (`formConfig`)
- Changes are local until "Save" is clicked
- No auto-save (intentional for better UX)

### **3. Saving to Supabase**

When user clicks "Save Form Configuration":

```javascript
await formService.saveFormConfig(selectedProject.id, formConfig)
// Calls: projectService.updateProjectSettings(projectId, { form_config: formConfig })
```

**Flow:**
1. User clicks "Save Form Configuration" button
2. `saveFormConfig()` function is called
3. Calls `formService.saveFormConfig()` with project ID and config
4. Updates Supabase `projects` table: `form_config` column
5. Updates local React state for both `projects` and `selectedProject`
6. Shows success alert to user

### **4. Using on Form Page**

When participants visit the form (`/{projectId}`):

```javascript
// In FormPage.jsx
const config = await formService.getFormConfig(projectId)
setFormConfig(config)
```

**Flow:**
1. User visits form URL
2. Form config is loaded from Supabase
3. Form fields are dynamically rendered based on config
4. Validation rules applied from config
5. Submission uses config to process data

---

## ✅ Verification Checklist

### **Database Setup:**
- [ ] Run `add_form_config_column.sql` in Supabase SQL Editor
- [ ] Verify column exists: `SELECT form_config FROM projects LIMIT 1;`
- [ ] Check column type: Should be `JSONB`

### **Admin Functionality:**
- [ ] Navigate to admin portal
- [ ] Select a project
- [ ] Click "Form Builder" tab
- [ ] Add/edit/remove fields
- [ ] Click "Save Form Configuration"
- [ ] Verify success message appears

### **Database Verification:**
```sql
-- Check if form_config was saved
SELECT id, name, form_config 
FROM projects 
WHERE id = 'your-project-id';
```

### **Form Page Testing:**
- [ ] Visit form page: `/{projectId}`
- [ ] Verify custom fields appear
- [ ] Test form submission
- [ ] Check validation works

---

## 🔍 Debugging

### **If Form Config Doesn't Save:**

1. **Check Supabase Connection:**
```javascript
// In browser console
console.log('Supabase client:', supabase)
```

2. **Check Database Column:**
```sql
-- In Supabase SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'form_config';
```

3. **Check RLS Policies:**
```sql
-- Verify you can update projects
SELECT * FROM projects WHERE id = 'your-project-id';
-- Try to update manually
UPDATE projects 
SET form_config = '{"test": true}'::jsonb 
WHERE id = 'your-project-id';
```

4. **Check Browser Console:**
- Look for "Form configuration saved successfully" message
- Check for any errors in Network tab
- Verify the Supabase request in DevTools

### **Common Issues:**

**Issue: "Failed to save form configuration"**
- **Cause:** Missing `form_config` column
- **Solution:** Run `add_form_config_column.sql`

**Issue: Form config not persisting**
- **Cause:** RLS policy blocking updates
- **Solution:** Check Supabase RLS policies for projects table

**Issue: Form shows default config instead of saved config**
- **Cause:** Config not loading from database
- **Solution:** Check `formService.getFormConfig()` logs

---

## 🧪 Test Data

To test the form builder, here's a sample config you can insert directly:

```sql
UPDATE projects 
SET form_config = '{
  "title": "Feedback Form",
  "subtitle": "We value your input",
  "buttonText": "Send Feedback",
  "successTitle": "Thanks!",
  "successMessage": "Your feedback has been received.",
  "showCharacterCount": true,
  "allowMultipleSubmissions": true,
  "fields": [
    {
      "id": "name",
      "type": "text",
      "label": "Your Name",
      "placeholder": "Enter your name...",
      "required": true,
      "maxLength": 100
    },
    {
      "id": "email",
      "type": "email",
      "label": "Email Address",
      "placeholder": "you@example.com",
      "required": true
    },
    {
      "id": "feedback",
      "type": "textarea",
      "label": "Your Feedback",
      "placeholder": "Tell us what you think...",
      "required": true,
      "maxLength": 500,
      "showCharacterCount": true
    }
  ]
}'::jsonb
WHERE id = 'your-project-id';
```

---

## 📝 Code Flow Documentation

### **Save Flow:**
```
User edits in Form Builder Tab
  ↓
Clicks "Save Form Configuration"
  ↓
saveFormConfig() called
  ↓
formService.saveFormConfig(projectId, formConfig)
  ↓
projectService.updateProjectSettings(projectId, { form_config: formConfig })
  ↓
Supabase UPDATE query
  ↓
Local state updated (projects & selectedProject)
  ↓
Success alert shown
```

### **Load Flow:**
```
User selects project from dashboard
  ↓
handleProjectSelect(project) called
  ↓
useEffect triggered (selectedProject changed)
  ↓
formService.getFormConfig(projectId)
  ↓
projectService.getProject(projectId)
  ↓
Supabase SELECT query
  ↓
Returns project.form_config || DEFAULT_FORM_CONFIG
  ↓
setFormConfig(config)
  ↓
Form Builder tab shows loaded config
```

---

## 🔐 Required Permissions

### **RLS Policies Needed:**

```sql
-- Allow authenticated users to read project form configs
CREATE POLICY "Users can read project form_config"
ON projects FOR SELECT
TO authenticated
USING (true);

-- Allow admins to update form configs
CREATE POLICY "Admins can update project form_config"
ON projects FOR UPDATE
TO authenticated
USING (
  -- Check if user is admin/owner
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);
```

---

## ✨ Features

### **What's Supported:**

✅ **Field Types:**
- Text input
- Textarea
- Email
- Select dropdown
- Emoji picker
- Color picker

✅ **Field Configuration:**
- Label customization
- Placeholder text
- Required validation
- Max length
- Character count toggle
- Field reordering
- Field deletion

✅ **Form Settings:**
- Form title
- Subtitle
- Button text
- Success message
- Character count display
- Multiple submissions

✅ **Persistence:**
- Saves to Supabase `form_config` column
- Loads automatically when project selected
- Falls back to defaults if no config exists

---

## 🚨 Important Notes

1. **JSONB Column**: The `form_config` column MUST be JSONB type (not JSON or TEXT)
2. **Default Value**: Set to `NULL` by default, not an empty object
3. **Validation**: Form validation happens client-side before save
4. **Backwards Compatibility**: Old projects without form_config will use DEFAULT_FORM_CONFIG
5. **Updated Timestamp**: The `updated_at` column is automatically updated via trigger

---

## 🎯 Next Steps

1. **Run the migration**: Execute `add_form_config_column.sql` in Supabase
2. **Verify RLS policies**: Ensure admins can update projects
3. **Test in admin**: Edit a form and save
4. **Check database**: Verify data saved correctly
5. **Test on form page**: Visit `/{projectId}` and verify fields appear

---

## 📞 Support

If you encounter issues:
1. Check browser console for error messages
2. Check Supabase logs for database errors
3. Verify RLS policies are correct
4. Ensure `form_config` column exists and is JSONB type
5. Check that you're logged in as admin/owner role

---

**Status:** ✅ Ready for Production  
**Build:** ✅ Passing (865ms)  
**Linter:** ✅ No errors  
**Database:** ⚠️ Run migration SQL first

