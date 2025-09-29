import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { projectService } from '../services/supabaseClient'
import { projectUrlService } from '../services/projectUrlService'
import { formService, renderFormField, generateFormData, validateForm } from '../services/formService.jsx'
import Logo from '../components/Logo'

const FormPage = () => {
  const { projectId } = useParams()
  const [formData, setFormData] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [projectInfo, setProjectInfo] = useState(null)
  const [formConfig, setFormConfig] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  // Load project information and form configuration
  useEffect(() => {
    const loadProjectData = async () => {
      const info = projectUrlService.getProjectInfo(projectId || 'demo')
      setProjectInfo(info)
      console.log('📋 FormPage: Loaded project info:', info)
      
      // Load form configuration
      try {
        const config = await formService.getFormConfig(projectId || 'demo')
        setFormConfig(config)
        setFormData(generateFormData(config))
        console.log('📝 FormPage: Loaded form config:', config)
      } catch (error) {
        console.error('⚠️ FormPage: Could not load form config:', error)
        setError('Failed to load form configuration')
      }
    }
    
    loadProjectData()
  }, [projectId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formConfig) return
    
    setIsSubmitting(true)
    setError(null)
    setValidationErrors({})
    
    try {
      // Validate form
      const validation = validateForm(formConfig, formData)
      if (!validation.isValid) {
        setValidationErrors(validation.errors)
        setIsSubmitting(false)
        return
      }
      
      console.log('📝 Submitting form:', { projectId, formData })
      
      // Submit form using form service
      const result = await formService.submitForm(projectId || 'demo', formConfig, formData)
      console.log('✅ Form submitted successfully:', result)
      
      setSubmitted(true)
      setFormData(generateFormData(formConfig)) // Reset form
    } catch (error) {
      console.error('❌ Error submitting form:', error)
      setError(error.message || 'Failed to submit form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
    // Clear validation error for this field
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldId]: []
      }))
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {formConfig?.successTitle || 'Thank you!'}
          </h2>
          <p className="text-gray-600 mb-6">
            {formConfig?.successMessage || 'Your submission has been received.'}
          </p>
          <button 
            onClick={() => setSubmitted(false)}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Submit Another
          </button>
        </div>
      </div>
    )
  }

  if (!formConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo width={80} height={80} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {formConfig.title}
          </h1>
          <p className="text-gray-600">{formConfig.subtitle}</p>
          {projectInfo && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-900">{projectInfo.name}</h2>
              {projectInfo.description && (
                <p className="text-sm text-blue-700 mt-1">{projectInfo.description}</p>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          {formConfig.fields.map((field) => 
            renderFormField(field, formData[field.id], handleFieldChange, validationErrors)
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : formConfig.buttonText}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a 
            href={projectInfo?.displayUrl || '/display/demo'}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            View The Wall →
          </a>
        </div>
      </div>
    </div>
  )
}

export default FormPage
