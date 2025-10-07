import React, { useState, useEffect } from 'react'

const BannerBuilder = ({ project, onSave, onCancel }) => {
  const [bannerConfig, setBannerConfig] = useState(() => {
    const existingBanner = project?.branding?.banner
    return {
      enabled: existingBanner?.enabled || false,
      backgroundColor: existingBanner?.backgroundColor || '#F4C542',
      textColor: existingBanner?.textColor || '#000000',
      height: existingBanner?.height || '60px',
      fontSize: existingBanner?.fontSize || 'medium',
      fontFamily: existingBanner?.fontFamily || 'Inter',
      marquee: existingBanner?.marquee || false,
      gap: existingBanner?.gap || '8px',
      position: existingBanner?.position || 'bottom',
      sections: existingBanner?.sections || [
        {
          id: 'main-text',
          type: 'text',
          content: 'Enter your banner text here',
          fontSize: 'extra-large',
          fontWeight: 'bold',
          color: '#000000',
          backgroundColor: 'transparent',
          textAlign: 'center',
          padding: '0'
        }
      ]
    }
  })

  // Only initialize once - don't reset when project changes
  // This prevents the banner from being reset when the parent component re-renders

  const addSection = (type) => {
    const newSection = {
      id: `section-${Date.now()}`,
      type: type,
      content: type === 'text' ? 'New text' : type === 'pill' ? 'Pill text' : 'Button text',
      fontSize: 'extra-large',
      fontWeight: 'bold',
      color: '#000000',
      backgroundColor: type === 'pill' ? '#E3F2FD' : type === 'button' ? '#1976D2' : 'transparent',
      textAlign: 'center',
      padding: type === 'pill' ? '6px 12px' : type === 'button' ? '6px 12px' : '0'
    }
    
    setBannerConfig(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }))
  }

  const updateSection = (sectionId, updates) => {
    setBannerConfig(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }))
  }

  const removeSection = (sectionId) => {
    setBannerConfig(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }))
  }

  const moveSection = (sectionId, direction) => {
    const sections = [...bannerConfig.sections]
    const index = sections.findIndex(s => s.id === sectionId)
    
    if (direction === 'up' && index > 0) {
      [sections[index], sections[index - 1]] = [sections[index - 1], sections[index]]
    } else if (direction === 'down' && index < sections.length - 1) {
      [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]]
    }
    
    setBannerConfig(prev => ({ ...prev, sections }))
  }

  const duplicateSection = (sectionId) => {
    const sections = [...bannerConfig.sections]
    const index = sections.findIndex(s => s.id === sectionId)
    
    if (index !== -1) {
      const originalSection = sections[index]
      const duplicatedSection = {
        ...originalSection,
        id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: originalSection.content + ' (copy)'
      }
      
      sections.splice(index + 1, 0, duplicatedSection)
      setBannerConfig(prev => ({ ...prev, sections }))
    }
  }

  const renderSection = (section) => {
    const baseStyle = {
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
      margin: `0 ${bannerConfig.gap || '8px'}`
    }

    return (
      <div key={section.id} style={baseStyle}>
        {section.content}
      </div>
    )
  }

  const handleSave = () => {
    const bannerData = {
      enabled: bannerConfig.enabled,
      backgroundColor: bannerConfig.backgroundColor,
      textColor: bannerConfig.textColor,
      height: bannerConfig.height,
      fontSize: bannerConfig.fontSize,
      fontFamily: bannerConfig.fontFamily,
      marquee: bannerConfig.marquee,
      gap: bannerConfig.gap,
      position: bannerConfig.position,
      sections: bannerConfig.sections,
      // Keep the old content format for backward compatibility
      content: bannerConfig.sections.map(section => {
        const style = `font-size: ${section.fontSize === 'small' ? '0.875rem' : 
                      section.fontSize === 'medium' ? '1rem' : 
                      section.fontSize === 'large' ? '1.25rem' : 
                      section.fontSize === 'extra-large' ? '1.5rem' : '1rem'}; 
                      font-weight: ${section.fontWeight}; 
                      color: ${section.color}; 
                      text-align: ${section.textAlign}; 
                      padding: ${section.padding}; 
                      background-color: ${section.backgroundColor}; 
                      border-radius: ${section.type === 'pill' ? '20px' : section.type === 'button' ? '8px' : '0'}; 
                      border: ${section.type === 'button' ? '2px solid #000' : 'none'}; 
                      display: inline-block; 
                      margin: 2px;`
        return `<span style="${style}">${section.content}</span>`
      }).join('')
    }
    
    console.log('🎨 BannerBuilder: Saving banner data:', bannerData)
    console.log('🎨 BannerBuilder: Sections:', bannerConfig.sections)
    console.log('🎨 BannerBuilder: Background color:', bannerConfig.backgroundColor)
    console.log('🎨 BannerBuilder: Text color:', bannerConfig.textColor)
    onSave(bannerData)
  }

  return (
    <div className="space-y-6">
      {/* Banner Settings */}
      <div className="border-[3px] border-black rounded-[14px] p-6 bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Banner Settings</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Background Color</label>
            <input
              type="color"
              value={bannerConfig.backgroundColor}
              onChange={(e) => setBannerConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
              className="w-full h-10 border-2 border-gray-300 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Text Color</label>
            <input
              type="color"
              value={bannerConfig.textColor}
              onChange={(e) => setBannerConfig(prev => ({ ...prev, textColor: e.target.value }))}
              className="w-full h-10 border-2 border-gray-300 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Height</label>
            <select
              value={bannerConfig.height}
              onChange={(e) => setBannerConfig(prev => ({ ...prev, height: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded"
            >
              <option value="40px">40px (Small)</option>
              <option value="60px">60px (Medium)</option>
              <option value="80px">80px (Large)</option>
              <option value="100px">100px (Extra Large)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Font Size</label>
            <select
              value={bannerConfig.fontSize}
              onChange={(e) => setBannerConfig(prev => ({ ...prev, fontSize: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={bannerConfig.enabled}
              onChange={(e) => setBannerConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              className="h-5 w-5 rounded border-gray-300"
            />
            <span className="text-base font-bold text-gray-900">Enable banner</span>
          </label>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={bannerConfig.marquee}
              onChange={(e) => setBannerConfig(prev => ({ ...prev, marquee: e.target.checked }))}
              className="h-5 w-5 rounded border-gray-300"
            />
            <span className="text-base font-bold text-gray-900">Enable smooth marquee animation</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Item Gap</label>
            <select
              value={bannerConfig.gap}
              onChange={(e) => setBannerConfig(prev => ({ ...prev, gap: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded"
            >
              <option value="2px">Tight (2px)</option>
              <option value="4px">Small (4px)</option>
              <option value="8px">Medium (8px)</option>
              <option value="12px">Large (12px)</option>
              <option value="16px">Extra Large (16px)</option>
              <option value="20px">Huge (20px)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Banner Position</label>
            <select
              value={bannerConfig.position}
              onChange={(e) => setBannerConfig(prev => ({ ...prev, position: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded"
            >
              <option value="top">Top of Screen</option>
              <option value="under-header">Under Header (Above Cards)</option>
              <option value="bottom">Bottom of Screen</option>
            </select>
          </div>
        </div>
      </div>

      {/* Banner Builder */}
      {bannerConfig.enabled && (
        <div className="border-[3px] border-black rounded-[14px] p-6 bg-white">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Banner Content Builder</h3>
          
          {/* Add Components */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-900 mb-3">Add Components</h4>
            <div className="flex gap-2">
              <button
                onClick={() => addSection('text')}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-bold"
              >
                + Text
              </button>
              <button
                onClick={() => addSection('pill')}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-bold"
              >
                + Pill
              </button>
              <button
                onClick={() => addSection('button')}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm font-bold"
              >
                + Button
              </button>
            </div>
          </div>

          {/* Banner Preview */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-900 mb-3">Preview</h4>
            <div
              className="p-4 border-2 border-gray-300 rounded min-h-[60px] flex flex-wrap items-center justify-center"
              style={{
                backgroundColor: bannerConfig.backgroundColor,
                color: bannerConfig.textColor,
                height: bannerConfig.height,
                fontFamily: bannerConfig.fontFamily,
                gap: bannerConfig.gap || '8px'
              }}
            >
              {bannerConfig.sections.map(renderSection)}
            </div>
          </div>

          {/* Section Editor */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-900">Edit Sections</h4>
            {bannerConfig.sections.map((section, index) => (
              <div key={section.id} className="border-2 border-gray-200 rounded p-4">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-bold text-gray-900">
                    {section.type.charAt(0).toUpperCase() + section.type.slice(1)} Section
                  </h5>
                  <div className="flex gap-2">
                    <button
                      onClick={() => moveSection(section.id, 'up')}
                      disabled={index === 0}
                      className="px-2 py-1 text-xs bg-gray-200 rounded disabled:opacity-50"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveSection(section.id, 'down')}
                      disabled={index === bannerConfig.sections.length - 1}
                      className="px-2 py-1 text-xs bg-gray-200 rounded disabled:opacity-50"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => duplicateSection(section.id)}
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => removeSection(section.id)}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Content</label>
                    <input
                      type="text"
                      value={section.content}
                      onChange={(e) => updateSection(section.id, { content: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Font Size</label>
                    <select
                      value={section.fontSize}
                      onChange={(e) => updateSection(section.id, { fontSize: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="extra-large">Extra Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Font Weight</label>
                    <select
                      value={section.fontWeight}
                      onChange={(e) => updateSection(section.id, { fontWeight: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded"
                    >
                      <option value="100">Thin (100)</option>
                      <option value="200">Extra Light (200)</option>
                      <option value="300">Light (300)</option>
                      <option value="normal">Normal (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">Semi Bold (600)</option>
                      <option value="bold">Bold (700)</option>
                      <option value="800">Extra Bold (800)</option>
                      <option value="900">Black (900)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Text Color</label>
                    <input
                      type="color"
                      value={section.color}
                      onChange={(e) => updateSection(section.id, { color: e.target.value })}
                      className="w-full h-10 border-2 border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                  {(section.type === 'pill' || section.type === 'button') && (
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Background Color</label>
                      <input
                        type="color"
                        value={section.backgroundColor}
                        onChange={(e) => updateSection(section.id, { backgroundColor: e.target.value })}
                        className="w-full h-10 border-2 border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-6 border-t-[3px] border-gray-200">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600"
        >
          Save Banner
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default BannerBuilder
