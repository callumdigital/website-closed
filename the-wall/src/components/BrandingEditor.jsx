import React, { useState, useEffect } from 'react'
import { DEFAULT_BRANDING, loadFontForBranding, debugCustomFont } from '../services/brandingService.jsx'
import { Button, Input } from './ui'

const BrandingEditor = ({ project, onSave, onCancel, isInline = false }) => {
  const [branding, setBranding] = useState(DEFAULT_BRANDING)
  const [titleQuestion, setTitleQuestion] = useState('')
  const [fontsLoaded, setFontsLoaded] = useState(true)

  useEffect(() => {
    if (project?.branding) {
      setBranding({ ...DEFAULT_BRANDING, ...project.branding })
    }
    if (project?.titleQuestion) {
      setTitleQuestion(project.titleQuestion)
    } else {
      setTitleQuestion('') // Ensure it's set to empty string if not provided
    }
    console.log('🎨 BrandingEditor: Project data loaded:', { 
      project, 
      branding: project?.branding, 
      titleQuestion: project?.titleQuestion 
    })
  }, [project])

  const handleSave = () => {
    console.log('🎨 BrandingEditor: Saving with:', { branding, titleQuestion })
    onSave(branding, titleQuestion)
  }

  const updateBranding = async (key, value) => {
    console.log('🎨 BrandingEditor: Updating', key, 'to', value)
    const newBranding = { ...branding, [key]: value }
    setBranding(newBranding)
    
    // If font family changed, load the new font
    if (key === 'fontFamily' || key === 'customFontFamily') {
      console.log('🔤 Font changed in BrandingEditor')
      console.log('🔤 fontFamily:', newBranding.fontFamily)
      console.log('🔤 customFontFamily:', newBranding.customFontFamily)
      
      // Debug custom fonts specifically
      if (newBranding.fontFamily === 'CUSTOM' || newBranding.customFontFamily) {
        debugCustomFont(newBranding)
      }
      
      setFontsLoaded(false)
      try {
        await loadFontForBranding(newBranding)
        setFontsLoaded(true)
        console.log('✅ Font loaded successfully in BrandingEditor')
      } catch (error) {
        console.warn('Failed to load font:', error)
        setFontsLoaded(true) // Continue anyway
      }
    }
  }

  const colorPresets = [
    { name: 'Blue', primary: '#3B82F6', secondary: '#64748B' },
    { name: 'Green', primary: '#10B981', secondary: '#6B7280' },
    { name: 'Purple', primary: '#8B5CF6', secondary: '#6B7280' },
    { name: 'Pink', primary: '#EC4899', secondary: '#6B7280' },
    { name: 'Orange', primary: '#F59E0B', secondary: '#6B7280' },
    { name: 'Red', primary: '#EF4444', secondary: '#6B7280' }
  ]

  const Wrapper = isInline ? 'div' : ({ children }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 admin-layout">
      <div className="bg-white rounded-[24px] border-[3px] border-black max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );

  return (
    <Wrapper>
      <div className={isInline ? '' : 'p-6 sm:p-8'}>
        {!isInline && (
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 admin-heading">Branding Settings</h2>
            <button
              onClick={onCancel}
              className="w-10 h-10 rounded-full border-[3px] border-black hover:bg-gray-100 transition-all flex items-center justify-center text-2xl font-bold"
            >
              ×
            </button>
          </div>
        )}
        
        {isInline && (
          <h2 className="text-2xl font-bold text-gray-900 admin-heading mb-6">
            Branding & Appearance
          </h2>
        )}

          <div className="space-y-6">
            {/* Color Presets */}
            <div>
              <label className="block text-base font-bold text-gray-900 mb-3 admin-heading">
                Quick Color Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setBranding(prev => ({
                        ...prev,
                        primaryColor: preset.primary,
                        secondaryColor: preset.secondary
                      }))
                    }}
                    className="p-4 border-[3px] border-black rounded-[14px] hover:bg-gray-50 transition-all hover:translate-y-[-2px]"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-black"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-black"
                        style={{ backgroundColor: preset.secondary }}
                      />
                      <span className="text-sm font-bold">{preset.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-bold text-gray-900 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => updateBranding('primaryColor', e.target.value)}
                    className="w-14 h-12 border-[3px] border-black rounded-[14px] cursor-pointer bg-gray-50"
                  />
                  <input
                    type="text"
                    value={branding.primaryColor}
                    onChange={(e) => updateBranding('primaryColor', e.target.value)}
                    className="flex-1 px-4 py-3 border-[3px] border-black rounded-[14px] focus:outline-none bg-gray-50 font-mono text-sm"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-bold text-gray-900 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.secondaryColor}
                    onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                    className="w-14 h-12 border-[3px] border-black rounded-[14px] cursor-pointer bg-gray-50"
                  />
                  <input
                    type="text"
                    value={branding.secondaryColor}
                    onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                    className="flex-1 px-4 py-3 border-[3px] border-black rounded-[14px] focus:outline-none bg-gray-50 font-mono text-sm"
                    placeholder="#64748B"
                  />
                </div>
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-base font-bold text-gray-900 mb-2">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={branding.backgroundColor}
                  onChange={(e) => updateBranding('backgroundColor', e.target.value)}
                  className="w-14 h-12 border-[3px] border-black rounded-[14px] cursor-pointer bg-gray-50"
                />
                <input
                  type="text"
                  value={branding.backgroundColor}
                  onChange={(e) => updateBranding('backgroundColor', e.target.value)}
                  className="flex-1 px-4 py-3 border-[3px] border-black rounded-[14px] focus:outline-none bg-gray-50 font-mono text-sm"
                  placeholder="#F8FAFC"
                />
              </div>
            </div>

            {/* Font Family */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-bold text-gray-900 mb-2">
                  Font Family
                </label>
                <select
                  value={branding.fontFamily}
                  onChange={(e) => updateBranding('fontFamily', e.target.value)}
                  className="w-full px-4 py-3 border-[3px] border-black rounded-[14px] focus:outline-none bg-gray-50 font-bold"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Source Sans Pro">Source Sans Pro</option>
                  <option value="Fredoka">Fredoka</option>
                  <option value="Roboto Condensed">Roboto Condensed</option>
                  <option value="Helvetica">Helvetica (System Font)</option>
                  <option value="Arial">Arial (System Font)</option>
                  <option value="Georgia">Georgia (System Font)</option>
                  <option value="Times New Roman">Times New Roman (System Font)</option>
                  <option value="CUSTOM">Custom Font...</option>
                </select>
              </div>
              
              {branding.fontFamily === 'CUSTOM' && (
                <div>
                  <Input
                    type="text"
                    label="Custom Font Family"
                    value={branding.customFontFamily || ''}
                    onChange={(e) => updateBranding('customFontFamily', e.target.value)}
                    placeholder="e.g., 'Bitcount Prop Single Ink'"
                    helpText="Enter the exact font name. System fonts will work immediately, Google Fonts will be loaded automatically."
                  />
                </div>
              )}
            </div>

            {/* Title/Question */}
            <Input
              type="text"
              label="Title/Question"
              value={titleQuestion}
              onChange={(e) => setTitleQuestion(e.target.value)}
              placeholder="e.g., 'What's on your mind?', 'Share your thoughts'"
              helpText="This will be displayed on the form and in the top-right of the wall display. Leave empty to use the project name."
            />

            {/* Note Colors */}
            <div>
              <label className="block text-base font-bold text-gray-900 mb-3">
                Available Note Colors
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['yellow', 'blue', 'pink', 'green', 'purple', 'orange', 'red', 'indigo'].map((color) => {
                  const colorMap = {
                    yellow: '#FFEAA7',
                    blue: '#74B9FF',
                    pink: '#FD79A8',
                    green: '#55EFC4',
                    purple: '#A29BFE',
                    orange: '#FDCB6E',
                    red: '#FF7675',
                    indigo: '#6C5CE7'
                  }
                  return (
                    <label 
                      key={color} 
                      className={`flex items-center gap-2 p-3 rounded-[14px] border-[3px] cursor-pointer transition-all ${
                        branding.noteColors.includes(color) 
                          ? 'border-black' 
                          : 'border-gray-300 hover:border-black'
                      }`}
                      style={{ backgroundColor: branding.noteColors.includes(color) ? colorMap[color] : 'white' }}
                    >
                      <input
                        type="checkbox"
                        checked={branding.noteColors.includes(color)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateBranding('noteColors', [...branding.noteColors, color])
                          } else {
                            updateBranding('noteColors', branding.noteColors.filter(c => c !== color))
                          }
                        }}
                        className="h-5 w-5 rounded border-gray-300"
                      />
                      <span className="text-sm font-bold capitalize">{color}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Logo URL */}
            <Input
              type="url"
              label="Logo URL (optional)"
              value={branding.logoUrl || ''}
              onChange={(e) => updateBranding('logoUrl', e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </div>

          {/* Preview */}
          <div className="mt-6 p-6 border-[3px] border-black rounded-[14px] bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900 admin-heading">Preview</h3>
              <span className="text-xs text-gray-600 font-bold">
                Font: {branding.customFontFamily || branding.fontFamily}
              </span>
            </div>
            <div 
              className="p-6 rounded-[14px] border-[3px] border-black"
              style={{ 
                backgroundColor: branding.backgroundColor,
                fontFamily: branding.customFontFamily || branding.fontFamily 
              }}
            >
              <h4 
                className="text-xl font-bold mb-3"
                style={{ color: branding.headingColor }}
              >
                Sample Form
              </h4>
              <p className="text-sm text-gray-600 mb-4">Share your thoughts and ideas</p>
              <div 
                className="px-6 py-3 rounded-[14px] text-sm font-bold border-[3px] border-black"
                style={{ 
                  backgroundColor: branding.primaryColor,
                  color: branding.backgroundColor === '#000000' ? '#FFFFFF' : '#000000'
                }}
              >
                Submit Button
              </div>
            </div>
          </div>

          {/* Actions */}
          {!isInline ? (
            <div className="flex gap-3 mt-6 pt-6 border-t-[3px] border-gray-200">
              <Button
                onClick={onCancel}
                variant="outline"
                size="medium"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                variant="primary"
                size="medium"
                className="flex-1"
              >
                Save Branding
              </Button>
            </div>
          ) : (
            <div className="mt-6 pt-6 border-t-[3px] border-gray-200">
              <Button
                onClick={handleSave}
                variant="primary"
                size="medium"
                fullWidth
              >
                Save Branding Changes
              </Button>
            </div>
          )}
        </div>
      </Wrapper>
  )
}

export default BrandingEditor
