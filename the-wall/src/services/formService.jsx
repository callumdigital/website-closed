import { noteService, projectService } from './supabaseClient.jsx'

// Form field types and their default configurations
export const FIELD_TYPES = {
  text: {
    type: 'text',
    label: 'Text Input',
    placeholder: 'Enter text...',
    validation: {
      required: false,
      maxLength: 100
    }
  },
  textarea: {
    type: 'textarea',
    label: 'Text Area',
    placeholder: 'Enter text...',
    validation: {
      required: false,
      maxLength: 280
    }
  },
  email: {
    type: 'email',
    label: 'Email',
    placeholder: 'Enter email...',
    validation: {
      required: false,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  },
  select: {
    type: 'select',
    label: 'Select',
    placeholder: 'Choose an option...',
    options: ['Option 1', 'Option 2'],
    validation: {
      required: false
    }
  },
  emoji: {
    type: 'emoji',
    label: 'Choose an Emoji',
    emojis: ['😀', '😊', '😍', '🤔', '😢', '😡', '🎉', '❤️', '👍', '👎'],
    allowCustomEmoji: true,
    validation: {
      required: false
    }
  },
  color: {
    type: 'color',
    label: 'Choose a Color',
    options: ['yellow', 'blue', 'pink', 'green', 'purple', 'orange', 'red', 'indigo'], // Default options, will be filtered by branding
    validation: {
      required: false
    }
  }
}

// Default form configuration
export const DEFAULT_FORM_CONFIG = {
  title: 'The Wall',
  subtitle: 'Share your thoughts and ideas',
  buttonText: 'Submit',
  successTitle: 'Thank you!',
  successMessage: 'Your submission has been received.',
  showCharacterCount: true,
  allowMultipleSubmissions: true,
  fields: [
    {
      id: 'main-note',
      type: 'textarea',
      label: 'What\'s on your mind?',
      placeholder: 'Write your note here...',
      required: true,
      maxLength: 280,
      showCharacterCount: true
    },
    {
      id: 'emoji',
      type: 'emoji',
      label: 'Choose an Emoji',
      required: false
    },
    {
      id: 'color',
      type: 'color',
      label: 'Choose a Color',
      required: false
    }
  ]
}

// Form validation functions
export const validateField = (field, value) => {
  const errors = []
  
  // Required validation
  if (field.required && (!value || value.trim() === '')) {
    errors.push(`${field.label} is required`)
  }
  
  // Max length validation
  if (field.maxLength && value && value.length > field.maxLength) {
    errors.push(`${field.label} must be ${field.maxLength} characters or less`)
  }
  
  // Email validation
  if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    errors.push('Please enter a valid email address')
  }
  
  return errors
}

// Validate entire form
export const validateForm = (formData, formConfig) => {
  const errors = {}
  let isValid = true
  
  if (!formConfig || !formConfig.fields) {
    console.warn('validateForm: formConfig or formConfig.fields is undefined')
    return { isValid: false, errors: { general: ['Form configuration is missing'] } }
  }
  
  formConfig.fields.forEach(field => {
    const fieldErrors = validateField(field, formData[field.id])
    if (fieldErrors.length > 0) {
      errors[field.id] = fieldErrors
      isValid = false
    }
  })
  
  return { isValid, errors }
}

// Generate form data from form configuration
export const generateFormData = (formConfig) => {
  const formData = {}
  if (formConfig && formConfig.fields) {
    formConfig.fields.forEach(field => {
      formData[field.id] = ''
    })
  }
  return formData
}

// Render form field component
export const renderFormField = (field, value, onChange, errors = {}, branding = {}) => {
  const fieldErrors = errors[field.id] || []
  const hasError = fieldErrors.length > 0
  
  const baseClasses = `w-full px-3 py-2.5 sm:px-4 sm:py-3 border-[3px] border-black rounded-[14px] focus:outline-none leading-normal text-sm sm:text-base ${
    hasError ? 'border-red-500 bg-red-50' : 'border-black bg-[#F5E6D3]'
  }`
  
  const fieldProps = {
    id: field.id,
    value: value || '',
    onChange: (e) => onChange(field.id, e.target.value),
    placeholder: field.placeholder,
    className: baseClasses,
    disabled: false
  }
  
  let fieldElement = null
  
  switch (field.type) {
    case 'textarea':
      fieldElement = (
        <textarea
          {...fieldProps}
          rows={3}
          maxLength={field.maxLength}
          className={`${baseClasses} resize-none`}
        />
      )
      break
      
    case 'text':
      fieldElement = (
        <input
          {...fieldProps}
          type="text"
          maxLength={field.maxLength}
        />
      )
      break
      
    case 'email':
      fieldElement = (
        <input
          {...fieldProps}
          type="email"
        />
      )
      break
      
    case 'select':
      fieldElement = (
        <select {...fieldProps}>
          <option value="">{field.placeholder}</option>
          {field.options?.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      )
      break
      
    case 'emoji':
      const emojiOptions = field.emojis || ['😊', '😢', '😍', '🤔', '😌', '😂', '😮', '😴', '😡', '🥰']
      const allowCustomEmoji = field.allowCustomEmoji !== false // Default to true
      fieldElement = (
        <div>
          {/* Emoji input field - only show if custom emojis are allowed */}
          {allowCustomEmoji && (
            <div className="relative mb-2">
              <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder="Type an emoji or select from below"
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-[3px] border-black rounded-[14px] bg-[#F5E6D3] focus:outline-none text-center text-lg sm:text-xl"
              />
            </div>
          )}
          {/* Emoji buttons */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
            {emojiOptions.map((emoji, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onChange(field.id, emoji)}
                className={`w-10 h-10 sm:w-12 sm:h-12 text-xl sm:text-2xl rounded-[14px] border-[3px] transition-all hover:translate-y-[-2px] ${
                  value === emoji 
                    ? 'border-black bg-[#F4C542]' 
                    : 'border-black bg-white hover:bg-gray-50'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )
      break
      
    case 'color':
      // Use note colors from branding configuration, fallback to default colors
      const availableColors = branding?.noteColors || ['yellow', 'blue', 'pink', 'green', 'purple', 'orange', 'red', 'indigo']
      const allColorOptions = [
        { value: 'yellow', label: 'Yellow', bg: '#FFEAA7' },
        { value: 'blue', label: 'Blue', bg: '#74B9FF' },
        { value: 'pink', label: 'Pink', bg: '#FD79A8' },
        { value: 'green', label: 'Green', bg: '#55EFC4' },
        { value: 'purple', label: 'Purple', bg: '#A29BFE' },
        { value: 'orange', label: 'Orange', bg: '#FDCB6E' },
        { value: 'red', label: 'Red', bg: '#FF7675' },
        { value: 'indigo', label: 'Indigo', bg: '#6C5CE7' }
      ]
      const colorOptions = allColorOptions.filter(color => availableColors.includes(color.value))
      fieldElement = (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {colorOptions.map((color, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onChange(field.id, color.value)}
              className={`h-12 sm:h-14 rounded-[14px] border-[3px] transition-all hover:translate-y-[-2px] flex items-center justify-center ${
                value === color.value 
                  ? 'border-black ring-4 ring-black ring-offset-2' 
                  : 'border-black hover:border-gray-600'
              }`}
              style={{ backgroundColor: color.bg }}
            >
              <span className="text-xs sm:text-sm font-bold text-gray-900">{color.label}</span>
            </button>
          ))}
        </div>
      )
      break
      
    default:
      fieldElement = (
        <input
          {...fieldProps}
          type="text"
        />
      )
  }
  
  return (
    <div key={field.id} className="mb-4">
      <label htmlFor={field.id} className="block text-sm sm:text-base font-bold text-gray-900 mb-1.5" style={{ letterSpacing: '0em' }}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {fieldElement}
        {field.showCharacterCount && field.maxLength && (field.type === 'textarea' || field.type === 'text') && (
          <div className="absolute bottom-2 right-3 text-xs text-gray-500 pointer-events-none">
            {(value || '').length}/{field.maxLength}
          </div>
        )}
      </div>
      {fieldErrors.length > 0 && (
        <div className="text-red-600 text-sm mt-2 font-bold">
          {fieldErrors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}
    </div>
  )
}

// Form service for managing form configurations
export const formService = {
  // Get form configuration for a project
  async getFormConfig(projectId) {
    try {
      const project = await projectService.getProject(projectId)
      console.log('🔍 Project data for form config:', project)
      console.log('🔍 Project form_config:', project.form_config)
      const config = project.form_config || DEFAULT_FORM_CONFIG
      console.log('🔍 Final form config:', config)
      console.log('🔍 Form config fields:', config.fields)
      return config
    } catch (error) {
      console.error('Error loading form config:', error)
      return DEFAULT_FORM_CONFIG
    }
  },
  
  // Save form configuration for a project
  async saveFormConfig(projectId, formConfig) {
    try {
      await projectService.updateProjectSettings(projectId, { form_config: formConfig })
      console.log('Form configuration saved successfully')
      return true
    } catch (error) {
      console.error('Error saving form config:', error)
      throw error
    }
  },
  
  // Submit form data
  async submitForm(projectId, formConfig, formData) {
    try {
      // Validate form data
      const validation = validateForm(formData, formConfig)
      if (!validation.isValid) {
        throw new Error('Form validation failed')
      }
      
      // Prepare note data - find any text field for the note content
      const textFields = formConfig.fields.filter(f => f.type === 'textarea' || f.type === 'text')
      const mainNoteField = formConfig.fields.find(f => f.id === 'main-note') || textFields[0]
      const noteText = formData[mainNoteField?.id] || ''
      
      // If no text field exists, create a default note
      if (!noteText.trim() && textFields.length === 0) {
        throw new Error('At least one text field is required for note submission')
      }
      
      if (!noteText.trim() && textFields.length > 0) {
        throw new Error('Note text is required')
      }
      
      // Get project settings for auto-approval
      const project = await projectService.getProject(projectId)
      
      // Get emoji and color from form data
      const emoji = formData.emoji || ''
      console.log('🎨 Form submission - Emoji from form data:', emoji)
      // Use available colors from project branding for random selection
      const availableColors = project?.branding?.noteColors || ['yellow', 'blue', 'green', 'pink', 'purple', 'orange']
      const color = formData.color || availableColors[Math.floor(Math.random() * availableColors.length)]
      const projectSettings = {
        auto_approve: project.auto_approve || false
      }
      
      // IMPORTANT: Save ALL form data, not just text/emoji/color
      // This ensures email, select, and other custom fields are preserved
      const completeFormData = { ...formData }
      
      // Submit to note service with complete form data
      const noteData = {
        project_id: projectId,
        text: noteText.trim(),
        color: color,
        emoji: emoji,
        form_data: completeFormData // Store all form field values
      }
      
      console.log('🎨 Form submission - Note data being sent to Supabase:', noteData)
      console.log('📋 Complete form data being saved:', completeFormData)
      const result = await noteService.createNote(noteData, projectSettings)
      console.log('Form submitted successfully:', result)
      return result
    } catch (error) {
      console.error('Error submitting form:', error)
      throw error
    }
  },
  
  // Get form analytics (placeholder for future implementation)
  async getFormAnalytics(projectId) {
    try {
      // This would typically query form submissions and return analytics
      // For now, return mock data
      return {
        totalSubmissions: 0,
        completionRate: 0,
        averageTimeToComplete: 0,
        fieldAnalytics: {}
      }
    } catch (error) {
      console.error('Error loading form analytics:', error)
      return null
    }
  }
}

// Utility functions for form management
export const formUtils = {
  // Create a new field
  createField(type, overrides = {}) {
    const baseField = FIELD_TYPES[type] || FIELD_TYPES.text
    return {
      id: `field-${Date.now()}`,
      ...baseField,
      ...overrides
    }
  },
  
  // Clone a field
  cloneField(field) {
    return {
      ...field,
      id: `field-${Date.now()}`,
      label: `${field.label} (Copy)`
    }
  },
  
  // Move field in array
  moveField(fields, fromIndex, toIndex) {
    const newFields = [...fields]
    const [movedField] = newFields.splice(fromIndex, 1)
    newFields.splice(toIndex, 0, movedField)
    return newFields
  },
  
  // Get field type configuration
  getFieldTypeConfig(type) {
    return FIELD_TYPES[type] || FIELD_TYPES.text
  }
}
