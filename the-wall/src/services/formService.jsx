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
    validation: {
      required: false
    }
  },
  color: {
    type: 'color',
    label: 'Choose a Color',
    options: ['yellow', 'blue', 'pink', 'green', 'purple', 'orange', 'red', 'indigo'],
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
  
  const baseClasses = `w-full px-3 py-2 border-2 border-black rounded-xl focus:outline-none focus:ring-0 ${
    hasError ? 'border-red-500' : 'border-black'
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
      const emojiOptions = ['😊', '😢', '😍', '🤔', '😌', '😂', '😮', '😴', '😡', '🥰']
      fieldElement = (
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            {emojiOptions.map((emoji, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onChange(field.id, emoji)}
                className={`w-10 h-10 text-xl rounded-xl border-2 transition-colors ${
                  value === emoji 
                    ? 'border-black' 
                    : 'border-black hover:bg-gray-100'
                }`}
                style={{
                  backgroundColor: value === emoji ? (branding?.primaryColor || '#FCD34D') + '40' : 'transparent'
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onChange(field.id, '')}
            className={`px-3 py-1 text-sm rounded-xl border-2 transition-colors ${
              !value 
                ? 'border-black' 
                : 'border-black hover:bg-gray-100'
            }`}
            style={{
              backgroundColor: !value ? (branding?.primaryColor || '#FCD34D') + '40' : 'transparent'
            }}
          >
            None
          </button>
        </div>
      )
      break
      
    case 'color':
      const colorOptions = [
        { value: 'yellow', label: 'Yellow', class: 'bg-yellow-200 border-yellow-300' },
        { value: 'blue', label: 'Blue', class: 'bg-blue-200 border-blue-300' },
        { value: 'pink', label: 'Pink', class: 'bg-pink-200 border-pink-300' },
        { value: 'green', label: 'Green', class: 'bg-green-200 border-green-300' },
        { value: 'purple', label: 'Purple', class: 'bg-purple-200 border-purple-300' },
        { value: 'orange', label: 'Orange', class: 'bg-orange-200 border-orange-300' },
        { value: 'red', label: 'Red', class: 'bg-red-200 border-red-300' },
        { value: 'indigo', label: 'Indigo', class: 'bg-indigo-200 border-indigo-300' }
      ]
      fieldElement = (
        <div className="grid grid-cols-4 gap-3">
          {colorOptions.map((color, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onChange(field.id, color.value)}
              className={`aspect-square rounded-xl border-2 transition-colors ${color.class} ${
                value === color.value 
                  ? 'border-black ring-2 ring-black ring-offset-1' 
                  : 'border-black hover:opacity-80'
              }`}
            >
              <span className="text-xs font-medium text-gray-700">{color.label}</span>
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
    <div key={field.id}>
      <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {fieldElement}
      {field.showCharacterCount && field.maxLength && (
        <div className="text-right text-sm text-gray-500 mt-1">
          {(value || '').length}/{field.maxLength}
        </div>
      )}
      {fieldErrors.length > 0 && (
        <div className="text-red-600 text-sm mt-1">
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
      return project.form_config || DEFAULT_FORM_CONFIG
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
      
      // Prepare note data - use main note text and separate emoji/color
      const mainNoteField = formConfig.fields.find(f => f.id === 'main-note')
      const noteText = formData[mainNoteField?.id] || ''
      
      if (!noteText.trim()) {
        throw new Error('Note text is required')
      }
      
      // Get emoji and color from form data
      const emoji = formData.emoji || ''
      const color = formData.color || ['yellow', 'blue', 'green', 'pink', 'purple', 'orange'][Math.floor(Math.random() * 6)]
      
      // Get project settings for auto-approval
      const project = await projectService.getProject(projectId)
      const projectSettings = {
        auto_approve: project.auto_approve || false
      }
      
      // Submit to note service
      const noteData = {
        project_id: projectId,
        text: noteText.trim(),
        color: color,
        emoji: emoji
      }
      
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
