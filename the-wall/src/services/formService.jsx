import { noteService, projectService } from './supabaseClient'

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
export const validateForm = (formConfig, formData) => {
  const errors = {}
  let isValid = true
  
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
  formConfig.fields.forEach(field => {
    formData[field.id] = ''
  })
  return formData
}

// Render form field component
export const renderFormField = (field, value, onChange, errors = {}) => {
  const fieldErrors = errors[field.id] || []
  const hasError = fieldErrors.length > 0
  
  const baseClasses = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    hasError ? 'border-red-500' : 'border-gray-300'
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
          rows={4}
          maxLength={field.maxLength}
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
      const validation = validateForm(formConfig, formData)
      if (!validation.isValid) {
        throw new Error('Form validation failed')
      }
      
      // Prepare note data (for now, we'll combine all fields into a single note)
      const noteText = formConfig.fields
        .map(field => {
          const value = formData[field.id]
          if (!value || value.trim() === '') return null
          return `${field.label}: ${value}`
        })
        .filter(Boolean)
        .join('\n\n')
      
      if (!noteText.trim()) {
        throw new Error('No data to submit')
      }
      
      // Get project settings for auto-approval
      const project = await projectService.getProject(projectId)
      const projectSettings = {
        auto_approve: project.auto_approve || false
      }
      
      // Submit to note service
      const noteData = {
        project_id: projectId,
        text: noteText.trim(),
        color: ['yellow', 'blue', 'green', 'pink', 'purple', 'orange'][Math.floor(Math.random() * 6)]
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
