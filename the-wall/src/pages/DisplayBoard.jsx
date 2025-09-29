import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { noteService, projectService } from '../services/supabaseClient.jsx'
import { getNoteColorClasses, loadSingleFont } from '../services/brandingService.jsx'
import Logo from '../components/Logo.jsx'

// Utility function to format timestamps in short format for display
const formatShortTimestamp = (timestamp) => {
  if (!timestamp) return ''
  
  const noteTime = new Date(timestamp)
  const now = new Date()
  const diffMs = now - noteTime
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMinutes < 1) return 'now'
  if (diffMinutes < 60) return `${diffMinutes}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  
  // For older notes, show time
  return noteTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// Helper function to apply font to DOM elements
const applyFontToElements = (fontName) => {
  console.log(`🔧 Applying font "${fontName}" to all relevant elements`)
  
  // Find all elements that should use the custom font
  const elementsToUpdate = [
    ...document.querySelectorAll('h1, h2, h3, h4, h5, h6'), // Headings
    ...document.querySelectorAll('p, span, div'), // Text elements
    ...document.querySelectorAll('[style*="fontFamily"]') // Elements with existing font styles
  ]
  
  console.log(`🔧 Found ${elementsToUpdate.length} elements to update`)
  
  elementsToUpdate.forEach((element, index) => {
    try {
      // Apply the font with fallbacks
      element.style.fontFamily = `"${fontName}", sans-serif`
      console.log(`🔧 Applied font to element ${index}:`, element.tagName, element.className)
    } catch (error) {
      console.warn(`⚠️ Failed to apply font to element ${index}:`, error)
    }
  })
  
  // Force a reflow to ensure the changes take effect
  document.body.offsetHeight
  
  console.log(`✅ Font application completed for "${fontName}"`)
}

const DisplayBoard = () => {
  const { projectId } = useParams()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState(null)
  const [fontLoaded, setFontLoaded] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Loading project data...')
        const projectData = await projectService.getProject(projectId)
        const notesData = await noteService.getAllNotes(projectId)
        
        console.log('📋 Project data:', projectData)
        console.log('📝 Notes data:', notesData)
        
        setProject(projectData)
        setNotes(notesData)
        
        // Load font if specified - simplified approach
        let fontToLoad = null
        if (projectData?.branding?.customFontFamily) {
          fontToLoad = projectData.branding.customFontFamily
          console.log('🔄 Loading custom font:', fontToLoad)
        } else if (projectData?.branding?.fontFamily && projectData.branding.fontFamily !== 'CUSTOM') {
          fontToLoad = projectData.branding.fontFamily
          console.log('🔄 Loading font:', fontToLoad)
        }
        
        if (fontToLoad) {
          try {
            await loadSingleFont(fontToLoad)
            console.log('✅ Font loading completed:', fontToLoad)
            
            // Wait a bit more for the font to be fully processed by the browser
            await new Promise(resolve => setTimeout(resolve, 300))
            console.log('✅ Font processing delay completed')
          } catch (error) {
            console.warn('⚠️ Font loading failed, continuing anyway:', error)
          }
        }
        
        setFontLoaded(true)
        
        // Apply font to DOM elements after a short delay to ensure font is loaded
        setTimeout(() => {
          if (fontToLoad) {
            console.log('🔧 Applying font to DOM elements:', fontToLoad)
            applyFontToElements(fontToLoad)
          }
        }, 500)
        
        setLoading(false)
      } catch (error) {
        console.error('❌ Error loading data:', error)
        setLoading(false)
      }
    }

    loadData()
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
        console.log('✅ Roboto Condensed font loaded for title')
      }
    }
    loadRobotoCondensed()
  }, [])

  // Reapply fonts when project data changes
  useEffect(() => {
    if (project && fontLoaded) {
      let fontToApply = null
      if (project?.branding?.customFontFamily) {
        fontToApply = project.branding.customFontFamily
      } else if (project?.branding?.fontFamily && project.branding.fontFamily !== 'CUSTOM') {
        fontToApply = project.branding.fontFamily
      }
      
      if (fontToApply) {
        // Apply font after a short delay to ensure DOM is ready
        setTimeout(() => {
          applyFontToElements(fontToApply)
        }, 100)
      }
    }
  }, [project, fontLoaded])

  // Make debug functions available globally
  useEffect(() => {
    window.testFontLoading = async (fontName = 'Roboto') => {
      console.log(`🧪 Testing font loading for: ${fontName}`)
      try {
        await loadSingleFont(fontName)
        console.log(`✅ ${fontName} loaded successfully`)
        
        // Apply to test element
        const testElement = document.querySelector('h1')
        if (testElement) {
          testElement.style.fontFamily = `"${fontName}", sans-serif`
          console.log(`✅ Applied ${fontName} to title element`)
        }
      } catch (error) {
        console.error(`❌ Failed to load ${fontName}:`, error)
      }
    }
    
    window.applyFontToAll = (fontName) => {
      applyFontToElements(fontName)
    }
    
    window.debugFonts = () => {
      const allFontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]')
      console.log('🔍 Google Fonts links:', allFontLinks.length)
      allFontLinks.forEach((link, index) => {
        console.log(`🔍 Link ${index}:`, link.href)
      })
      
      const elementsWithFonts = document.querySelectorAll('[style*="fontFamily"]')
      console.log('🔍 Elements with font styles:', elementsWithFonts.length)
      elementsWithFonts.forEach((element, index) => {
        console.log(`🔍 Element ${index}:`, element.tagName, element.className, element.style.fontFamily)
      })
    }
  }, [])

  if (loading || !fontLoaded) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg">
            {loading ? 'Loading...' : 'Loading fonts...'}
          </div>
        </div>
      </div>
    )
  }

  // Determine the font to use - now that we know inline styles work!
  let fontToUse = 'Inter, sans-serif'
  if (project?.branding?.customFontFamily) {
    fontToUse = project.branding.customFontFamily
    console.log('🎨 Using custom font family:', fontToUse)
  } else if (project?.branding?.fontFamily && project.branding.fontFamily !== 'CUSTOM') {
    fontToUse = project.branding.fontFamily
    console.log('🎨 Using regular font family:', fontToUse)
  } else {
    console.log('🎨 Using default font:', fontToUse)
  }

  console.log('🎨 Using font:', fontToUse)
  console.log('🎨 Project branding:', project?.branding)

  return (
    <>
      {/* Large screen optimization styles */}
      <style jsx>{`
        .wall-card {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .wall-card > div {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
        }
        
        .wall-title {
          font-family: 'Roboto Condensed', sans-serif !important;
        }
        
        /* Ensure wall-title overrides any branding font */
        h1.wall-title {
          font-family: 'Roboto Condensed', sans-serif !important;
        }
        
        @media (min-width: 1920px) {
          .wall-container {
            font-size: 1.125rem;
          }
          .wall-title {
            font-size: 3.5rem;
            line-height: 1.1;
          }
          .wall-card {
            min-height: 200px;
            padding: 1.5rem;
          }
          .wall-card-text {
            font-size: 1.25rem;
            line-height: 1.4;
          }
        }
        
        @media (min-width: 2560px) {
          .wall-container {
            font-size: 1.5rem;
          }
          .wall-title {
            font-size: 5rem;
          }
          .wall-card {
            min-height: 300px;
            padding: 2.5rem;
          }
          .wall-card-text {
            font-size: 1.75rem;
          }
        }
        
        @media (min-width: 3840px) {
          .wall-container {
            font-size: 2rem;
          }
          .wall-title {
            font-size: 6rem;
          }
          .wall-card {
            min-height: 350px;
            padding: 3rem;
          }
          .wall-card-text {
            font-size: 2.25rem;
          }
        }
      `}</style>
      
    <div 
      className="wall-container min-h-screen w-full p-6 lg:p-8 xl:p-12" 
      style={{
        backgroundColor: project?.branding?.backgroundColor || '#F8FAFC',
        fontFamily: fontToUse,
        width: '100vw',
        maxWidth: '100vw',
        // Custom styles for large displays
        fontSize: 'clamp(16px, 1.2vw, 24px)', // Responsive base font size
      }}
    >
      <div 
        className="w-full"
        style={{
          fontFamily: fontToUse
        }}
      >
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8 lg:mb-12 xl:mb-16 px-4">
          <div className="flex items-center">
            <Logo width={80} height={80} />
            <h1 
              className="wall-title text-5xl lg:text-6xl xl:text-7xl font-bold ml-1 whitespace-nowrap"
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
                <div className="h-12 w-px bg-black mx-4"></div>
                <img 
                  src={project.branding.logoUrl} 
                  alt="Custom Logo" 
                  className="h-16 w-auto"
                  style={{ maxHeight: '64px' }}
                />
              </>
            )}
          </div>
          {project?.titleQuestion && (
            <div 
              className="text-right max-w-lg lg:max-w-xl xl:max-w-2xl"
              style={{
                fontFamily: fontToUse,
                color: project?.branding?.headingColor || '#1E293B'
              }}
            >
              <h2 
                className="text-3xl lg:text-4xl xl:text-5xl font-semibold leading-tight"
                style={{
                  fontFamily: fontToUse
                }}
              >
                {project.titleQuestion}
              </h2>
            </div>
          )}
        </div>

        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 lg:gap-3 xl:gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`wall-card p-2 lg:p-3 xl:p-4 rounded-3xl transform hover:scale-105 transition-all duration-300 ${getNoteColorClasses(note.color, project?.branding?.noteShadow)}`}
              style={{
                borderRadius: '32px', // Much more rounded corners
                fontFamily: fontToUse,
                minHeight: '200px',
                aspectRatio: '1/1', // Make cards square like the example
                overflow: 'hidden', // Prevent content from overflowing
                wordWrap: 'break-word' // Break long words
              }}
            >
              <div className="flex flex-col h-full text-center relative" style={{ minHeight: '100%' }}>
                <div className="flex-1 flex flex-col items-center justify-center space-y-3 px-1 py-2">
                  <p 
                    className="wall-card-text text-sm lg:text-base xl:text-lg text-gray-800 leading-tight font-medium overflow-hidden" 
                    style={{ 
                      fontFamily: fontToUse,
                      display: '-webkit-box',
                      WebkitLineClamp: 6,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.3'
                    }}
                  >
                    {note.text}
                  </p>
                  {note.emoji && (
                    <div className="text-2xl lg:text-3xl xl:text-4xl flex-shrink-0 mt-2">
                      {note.emoji}
                    </div>
                  )}
                </div>
                {project?.show_timestamps && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs lg:text-sm text-gray-600 flex-shrink-0">
                    🕐 {formatShortTimestamp(note.created_at)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {notes.length === 0 && (
          <div 
            className="text-center text-gray-500 mt-16 lg:mt-20 xl:mt-24"
            style={{ fontFamily: fontToUse }}
          >
            <div className="text-2xl lg:text-3xl xl:text-4xl mb-4">
              No notes yet.
            </div>
            <div className="text-lg lg:text-xl xl:text-2xl">
              Be the first to add one!
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

export default DisplayBoard