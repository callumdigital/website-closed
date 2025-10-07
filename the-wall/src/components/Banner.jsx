import React from 'react'

const Banner = ({ project }) => {
  if (!project?.branding?.banner?.enabled) {
    return null
  }

  const banner = project.branding.banner
  
  // Debug logging
  console.log('🎨 Banner: Rendering banner with config:', banner)
  console.log('🎨 Banner: Background color:', banner.backgroundColor)
  console.log('🎨 Banner: Position:', banner.position)

  // Function to determine if background is light or dark
  const getContrastColor = (backgroundColor) => {
    if (!backgroundColor) return '#000000'
    
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    
    // Return black for light backgrounds, white for dark backgrounds
    return luminance > 0.5 ? '#000000' : '#FFFFFF'
  }

  const separatorColor = getContrastColor(banner.backgroundColor)

  // Determine position classes and styles
  const getPositionClasses = () => {
    switch (banner.position) {
      case 'top':
        return 'fixed top-0 left-0'
      case 'under-header':
        return 'relative w-full'
      case 'bottom':
      default:
        return 'fixed bottom-0 left-0'
    }
  }

  // If we have sections (new format), render them individually
  if (banner.sections && banner.sections.length > 0) {
    return (
      <div 
        className={`${getPositionClasses()} z-10 flex items-center justify-center py-2 banner-container`}
        style={{
          backgroundColor: banner.backgroundColor || '#F4C542',
          color: banner.textColor || '#000000',
          height: banner.height || '60px',
          fontFamily: banner.fontFamily || 'Inter',
          width: '100vw',
          transition: 'width 0.3s ease',
          direction: 'ltr',
          unicodeBidi: 'normal'
        }}
      >
        <div 
          style={{
            width: '100%',
            maxWidth: '100%',
            margin: '0 auto',
            paddingLeft: project?.branding?.sidebar?.enabled && banner.position !== 'under-header' 
              ? `${project.branding.sidebar.width || '300px'}` 
              : '1rem',
            paddingRight: '1rem'
          }}
        >
          <div 
            className={`flex items-center ${banner.marquee ? 'marquee-container' : 'justify-center'}`}
            style={{
              direction: 'ltr',
              textAlign: banner.marquee ? 'left' : 'center',
              overflow: 'visible',
              whiteSpace: banner.marquee ? 'nowrap' : 'nowrap',
              width: '100%'
            }}
          >
            {banner.marquee ? (
              <div 
                className="marquee-content"
                style={{
                  display: 'inline-block',
                  whiteSpace: 'nowrap',
                  overflow: 'visible'
                }}
              >
                {/* First set of content */}
                {banner.sections.map((section) => {
                  const sectionStyle = {
                    fontSize: section.fontSize === 'small' ? '0.875rem' : 
                              section.fontSize === 'medium' ? '1rem' : 
                              section.fontSize === 'large' ? '1.25rem' : 
                              section.fontSize === 'extra-large' ? '1.5rem' : '1rem',
                    fontWeight: section.fontWeight,
                    color: section.color,
                    textAlign: section.textAlign,
                    padding: section.padding,
                    backgroundColor: section.backgroundColor,
                    borderRadius: section.type === 'pill' ? '20px' : section.type === 'button' ? '8px' : '0',
                    border: 'none',
                    display: 'inline-block',
                    margin: `0 ${banner.gap || '8px'}`,
                    direction: 'ltr',
                    unicodeBidi: 'normal'
                  }

                  return (
                    <span key={section.id} style={sectionStyle}>
                      {section.content}
                    </span>
                  )
                })}
                
                {/* Spacer */}
                <span style={{ margin: '0 30px', display: 'inline-block', opacity: 0.5, color: separatorColor }}>•</span>
                
                {/* Second set of content for seamless loop */}
                {banner.sections.map((section) => {
                  const sectionStyle = {
                    fontSize: section.fontSize === 'small' ? '0.875rem' : 
                              section.fontSize === 'medium' ? '1rem' : 
                              section.fontSize === 'large' ? '1.25rem' : 
                              section.fontSize === 'extra-large' ? '1.5rem' : '1rem',
                    fontWeight: section.fontWeight,
                    color: section.color,
                    textAlign: section.textAlign,
                    padding: section.padding,
                    backgroundColor: section.backgroundColor,
                    borderRadius: section.type === 'pill' ? '20px' : section.type === 'button' ? '8px' : '0',
                    border: 'none',
                    display: 'inline-block',
                    margin: `0 ${banner.gap || '8px'}`,
                    direction: 'ltr',
                    unicodeBidi: 'normal'
                  }

                  return (
                    <span key={`${section.id}-duplicate`} style={sectionStyle}>
                      {section.content}
                    </span>
                  )
                })}
                
                {/* Another spacer */}
                <span style={{ margin: '0 30px', display: 'inline-block', opacity: 0.5, color: separatorColor }}>•</span>
                
                {/* Third set of content for extra continuity */}
                {banner.sections.map((section) => {
                  const sectionStyle = {
                    fontSize: section.fontSize === 'small' ? '0.875rem' : 
                              section.fontSize === 'medium' ? '1rem' : 
                              section.fontSize === 'large' ? '1.25rem' : 
                              section.fontSize === 'extra-large' ? '1.5rem' : '1rem',
                    fontWeight: section.fontWeight,
                    color: section.color,
                    textAlign: section.textAlign,
                    padding: section.padding,
                    backgroundColor: section.backgroundColor,
                    borderRadius: section.type === 'pill' ? '20px' : section.type === 'button' ? '8px' : '0',
                    border: 'none',
                    display: 'inline-block',
                    margin: `0 ${banner.gap || '8px'}`,
                    direction: 'ltr',
                    unicodeBidi: 'normal'
                  }

                  return (
                    <span key={`${section.id}-triple`} style={sectionStyle}>
                      {section.content}
                    </span>
                  )
                })}
              </div>
            ) : (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  fontSize: 'clamp(0.75rem, 2vw, 1.5rem)',
                  transform: 'scale(1)',
                  transformOrigin: 'center'
                }}
              >
                {banner.sections.map((section) => {
                  const sectionStyle = {
                    fontSize: section.fontSize === 'small' ? '0.875rem' : 
                              section.fontSize === 'medium' ? '1rem' : 
                              section.fontSize === 'large' ? '1.25rem' : 
                              section.fontSize === 'extra-large' ? '1.5rem' : '1rem',
                    fontWeight: section.fontWeight,
                    color: section.color,
                    textAlign: section.textAlign,
                    padding: section.padding,
                    backgroundColor: section.backgroundColor,
                    borderRadius: section.type === 'pill' ? '20px' : section.type === 'button' ? '8px' : '0',
                    border: 'none',
                    display: 'inline-block',
                    margin: `0 ${banner.gap || '8px'}`,
                    direction: 'ltr',
                    unicodeBidi: 'normal',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }

                  return (
                    <span key={section.id} style={sectionStyle}>
                      {section.content}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Fallback to old format (HTML content)
  return (
    <div 
      className={`${getPositionClasses()} z-10 flex items-center justify-center py-2 banner-container`}
      style={{
        backgroundColor: banner.backgroundColor || '#F4C542',
        color: banner.textColor || '#000000',
        height: banner.height || '60px',
        fontFamily: banner.fontFamily || 'Inter',
        width: '100vw',
        transition: 'width 0.3s ease',
        direction: 'ltr',
        unicodeBidi: 'normal'
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '100%',
          margin: '0 auto',
          paddingLeft: project?.branding?.sidebar?.enabled && banner.position !== 'under-header' 
            ? `${project.branding.sidebar.width || '300px'}` 
            : '1rem',
          paddingRight: '1rem'
        }}
      >
        <div 
          className="flex flex-wrap items-center justify-center"
          style={{
            direction: 'ltr',
            textAlign: 'center'
          }}
          dangerouslySetInnerHTML={{ __html: banner.content || '' }}
        />
      </div>
    </div>
  )
}

export default Banner