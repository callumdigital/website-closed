import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { projectService } from '../services/supabaseClient.jsx'
import { projectUrlService } from '../services/projectUrlService'
import { formService, renderFormField, generateFormData, validateForm } from '../services/formService.jsx'
import { loadSingleFont } from '../services/brandingService.jsx'
import Logo from '../components/Logo.jsx'

const FormPage = () => {
  const { projectId } = useParams()
  const [formData, setFormData] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [projectInfo, setProjectInfo] = useState(null)
  const [formConfig, setFormConfig] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [project, setProject] = useState(null)
  const [fontLoaded, setFontLoaded] = useState(false)

  useEffect(() => {
    const loadProjectData = async () => {
      try {
        console.log('🔄 Loading project data...')
        
        // Load project info
        const info = projectUrlService.getProjectInfo(projectId || 'demo')
        setProjectInfo(info)
        console.log('📋 Project info:', info)
        
        // Load project details
        const projectData = await projectService.getProject(projectId || 'demo')
        setProject(projectData)
        console.log('📋 Project data:', projectData)
        
        // Load form configuration
        const config = await formService.getFormConfig(projectId || 'demo')
        console.log('📝 Raw form config:', config)
        setFormConfig(config)
        const generatedFormData = generateFormData(config)
        console.log('📝 Generated form data:', generatedFormData)
        setFormData(generatedFormData)
        
        // Load font if specified
        if (projectData?.branding?.customFontFamily) {
          const customFont = projectData.branding.customFontFamily
          console.log('🔄 Loading custom font:', customFont)
          try {
            await loadSingleFont(customFont)
            console.log('✅ Custom font loaded:', customFont)
          } catch (error) {
            console.warn('⚠️ Failed to load custom font:', error)
          }
        } else if (projectData?.branding?.fontFamily) {
          const font = projectData.branding.fontFamily
          console.log('🔄 Loading font:', font)
          try {
            await loadSingleFont(font)
            console.log('✅ Font loaded:', font)
          } catch (error) {
            console.warn('⚠️ Failed to load font:', error)
          }
        }
        
        setFontLoaded(true)
      } catch (error) {
        console.error('❌ Error loading project data:', error)
        setError('Failed to load form configuration')
      }
    }

    loadProjectData()
  }, [projectId])

  // Load Roboto Condensed for the title
  useEffect(() => {
    const loadRobotoCondensed = () => {
      const existingLink = document.querySelector('link[href*="Roboto+Condensed"]')
      if (!existingLink) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&display=swap'
        document.head.appendChild(link)
        console.log('✅ Roboto Condensed font loaded for FormPage title')
      }
    }
    loadRobotoCondensed()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formConfig) return

    // Validate form
    console.log('🔍 Form data:', formData)
    console.log('🔍 Form config:', formConfig)
    const validation = validateForm(formData, formConfig)
    console.log('🔍 Validation result:', validation)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      console.log('📤 Submitting form data:', formData)
      // Submit form using the form service
      await formService.submitForm(projectId || 'demo', formConfig, formData)
      setSubmitted(true)
      console.log('✅ Form submitted successfully')
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
      <div 
        className="min-h-screen flex items-center justify-center bg-gray-50"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
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

  if (!formConfig || !fontLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!formConfig ? 'Loading form...' : 'Loading fonts...'}
          </p>
        </div>
      </div>
    )
  }

  // Determine the font to use - simple approach
  let fontToUse = 'Inter, sans-serif'
  if (project?.branding?.customFontFamily) {
    fontToUse = project.branding.customFontFamily
  } else if (project?.branding?.fontFamily) {
    fontToUse = project.branding.fontFamily
  }

  console.log('🎨 Using font:', fontToUse)
  console.log('🎨 Project branding:', project?.branding)

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: project?.branding?.backgroundColor || '#F8FAFC',
        fontFamily: fontToUse
      }}
    >
      <div 
        className="flex-1 flex flex-col justify-center p-4 max-w-md mx-auto w-full"
        style={{
          fontFamily: fontToUse
        }}
      >
        <div className="mb-6">
          {/* Header Section - Same as DisplayBoard */}
          <div className="flex items-center justify-between mb-6 px-4">
            <div className="flex items-center" style={{ minWidth: '200px' }}>
              <Logo width={80} height={80} />
              <h1 
                className="wall-title text-3xl lg:text-4xl xl:text-5xl font-bold ml-1 whitespace-nowrap"
                style={{
                  color: '#000000',
                  fontFamily: 'Roboto Condensed, sans-serif !important',
                  letterSpacing: '-0.02em'
                }}
              >
                The Wall
              </h1>
              {project?.branding?.logoUrl && (
                <>
                  <div className="h-10 w-px bg-black mx-3"></div>
                  <img 
                    src={project.branding.logoUrl} 
                    alt="Custom Logo" 
                    className="h-12 w-auto"
                    style={{ maxHeight: '48px' }}
                  />
                </>
              )}
            </div>
          </div>
          {project?.titleQuestion && (
            <div 
              className="mt-3 p-4 border-2 border-black rounded-xl text-center"
              style={{ 
                fontFamily: fontToUse,
                backgroundColor: project?.branding?.secondaryColor ? `${project.branding.secondaryColor}20` : '#FCD34D20',
                color: project?.branding?.headingColor || '#1E293B'
              }}
            >
              <h2 
                className="text-lg lg:text-xl xl:text-2xl font-semibold"
                style={{ 
                  fontFamily: fontToUse
                }}
              >
                {project.titleQuestion}
              </h2>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div 
              className="bg-red-50 border border-red-200 rounded-lg p-4"
              style={{ fontFamily: fontToUse }}
            >
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          {formConfig.fields.map((field) => 
            renderFormField(field, formData[field.id], handleFieldChange, validationErrors, project?.branding)
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl font-medium border-2 border-black focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              backgroundColor: project?.branding?.primaryColor || '#FCD34D',
              color: project?.branding?.backgroundColor === '#000000' ? '#FFFFFF' : '#000000',
              fontFamily: fontToUse
            }}
          >
            {isSubmitting ? 'Submitting...' : formConfig.buttonText}
          </button>
        </form>

        <div 
          className="mt-6 text-center"
          style={{ fontFamily: fontToUse }}
        >
          <a 
            href={projectInfo?.displayUrl || 'demo/display'}
            className="text-blue-500 hover:text-blue-600 text-sm"
            style={{ fontFamily: fontToUse }}
          >
            View The Wall →
          </a>
        </div>
      </div>
      
      <style jsx>{`
        .wall-title {
          font-family: 'Roboto Condensed', sans-serif !important;
        }
        h1.wall-title {
          font-family: 'Roboto Condensed', sans-serif !important;
        }
      `}</style>
    </div>
  )
}

export default FormPage