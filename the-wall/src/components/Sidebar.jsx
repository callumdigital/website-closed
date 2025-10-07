import React from 'react'
import QRCode from './QRCode.jsx'

const Sidebar = ({ project, qrSize }) => {
  if (!project?.branding?.sidebar?.enabled) {
    return null
  }

  const sidebar = project.branding.sidebar
  const qrCodePosition = sidebar.qrCodePosition || 'bottom'

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .sidebar-text * {
            direction: ltr !important;
            unicode-bidi: normal !important;
          }
        `
      }} />
      <div 
        className="fixed right-0 top-0 h-full z-30 flex flex-col sidebar-container"
        style={{
          width: sidebar.width || '300px',
          backgroundColor: sidebar.backgroundColor || '#FFFFFF',
          color: sidebar.textColor || '#000000',
          direction: 'ltr'
        }}
      >
      <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between">
        <div className="space-y-6">
          {/* QR Code at top if selected */}
          {qrCodePosition === 'top' && (
            <div className="text-center">
              <div className="w-full">
                <QRCode 
                  url={`${window.location.origin}/${project.id}`}
                  size={200} // Fixed size, will be scaled to 95% of container
                  draggable={false}
                  className="w-full"
                />
              </div>
              <div className="text-sm font-bold mt-2" style={{ color: sidebar.textColor || '#000000' }}>
                Scan to add note
              </div>
            </div>
          )}

          {/* Text Blurb */}
          {sidebar.textBlurb && (
            <div>
              <div 
                className="p-6 rounded-[14px] text-center"
                style={{
                  backgroundColor: sidebar.backgroundColor === '#FFFFFF' ? '#F8F9FA' : sidebar.backgroundColor,
                  color: sidebar.textColor || '#000000'
                }}
              >
               <div 
                 className={`sidebar-text leading-tight ${
                   sidebar.textSize === 'small' ? 'text-sm' :
                   sidebar.textSize === 'medium' ? 'text-base' :
                   sidebar.textSize === 'large' ? 'text-lg sm:text-xl' :
                   sidebar.textSize === 'extra-large' ? 'text-xl sm:text-2xl' :
                   'text-lg sm:text-xl'
                 }`}
                 style={{ direction: 'ltr', unicodeBidi: 'normal' }}
                 dangerouslySetInnerHTML={{ __html: sidebar.textBlurb }}
               />
              </div>
            </div>
          )}

          {/* Image */}
          {sidebar.imageUrl && (
            <div>
              <div className="rounded-[14px] overflow-hidden w-full" style={{ aspectRatio: '1/1' }}>
                <img
                  src={sidebar.imageUrl}
                  alt={sidebar.imageAlt || 'Sidebar image'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* QR Code at bottom if selected */}
        {qrCodePosition === 'bottom' && (
          <div className="text-center mt-6">
            <div className="w-full">
              <QRCode 
                url={`${window.location.origin}/${project.id}`}
                size={200} // Fixed size, will be scaled to 95% of container
                draggable={false}
                className="w-full"
              />
            </div>
            <div className="text-sm font-bold mt-2" style={{ color: sidebar.textColor || '#000000' }}>
              Scan to add note
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

export default Sidebar
