import React, { useState, useEffect } from 'react'
import { DEFAULT_BRANDING, loadFontForBranding, debugCustomFont } from '../services/brandingService.jsx'

const BrandingEditor = ({ project, onSave, onCancel }) => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Branding Settings</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Color Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quick Color Presets
              </label>
              <div className="grid grid-cols-3 gap-3">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      updateBranding('primaryColor', preset.primary)
                      updateBranding('secondaryColor', preset.secondary)
                    }}
                    className="p-3 border rounded-lg hover:border-gray-400 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: preset.secondary }}
                      />
                      <span className="text-sm font-medium">{preset.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => updateBranding('primaryColor', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding.primaryColor}
                    onChange={(e) => updateBranding('primaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={branding.secondaryColor}
                    onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding.secondaryColor}
                    onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#64748B"
                  />
                </div>
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={branding.backgroundColor}
                  onChange={(e) => updateBranding('backgroundColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={branding.backgroundColor}
                  onChange={(e) => updateBranding('backgroundColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#F8FAFC"
                />
              </div>
            </div>

            {/* Font Family */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Family
                </label>
                <select
                  value={branding.fontFamily}
                  onChange={(e) => updateBranding('fontFamily', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Font Family
                  </label>
                  <input
                    type="text"
                    value={branding.customFontFamily || ''}
                    onChange={(e) => updateBranding('customFontFamily', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 'Bitcount Prop Single Ink', 'Helvetica', 'Arial'"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the exact font name. System fonts will work immediately, Google Fonts will be loaded automatically.
                  </p>
                </div>
              )}
            </div>

            {/* Title/Question */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title/Question
              </label>
              <input
                type="text"
                value={titleQuestion}
                onChange={(e) => setTitleQuestion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 'What's on your mind?', 'Share your thoughts', 'Tell us something'"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be displayed on the form and in the top-right of the wall display. Leave empty to use the project name.
              </p>
            </div>

            {/* Note Colors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Note Colors
              </label>
              <div className="flex flex-wrap gap-2">
                {['yellow', 'blue', 'pink', 'green', 'purple', 'orange', 'red', 'indigo'].map((color) => (
                  <label key={color} className="flex items-center space-x-2">
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
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm capitalize">{color}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo URL (optional)
              </label>
              <input
                type="url"
                value={branding.logoUrl || ''}
                onChange={(e) => updateBranding('logoUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-700">Preview</h3>
              <span className="text-xs text-gray-500">
                Font: {branding.customFontFamily || branding.fontFamily}
              </span>
            </div>
            <div 
              className="p-4 rounded-lg"
              style={{ 
                backgroundColor: branding.backgroundColor,
                fontFamily: branding.customFontFamily || branding.fontFamily 
              }}
            >
              <h4 
                className="text-lg font-bold mb-2"
                style={{ color: branding.headingColor }}
              >
                Sample Form
              </h4>
              <p className="text-sm text-gray-600 mb-3">Share your thoughts and ideas</p>
              <div 
                className="px-4 py-2 rounded text-white text-sm"
                style={{ backgroundColor: branding.primaryColor }}
              >
                Submit Button
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-white rounded-lg transition-colors"
              style={{ backgroundColor: branding.primaryColor }}
            >
              Save Branding
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BrandingEditor
