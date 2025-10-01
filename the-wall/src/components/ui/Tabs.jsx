import React from 'react'

export const Tab = ({ label, icon, active, onClick, badge }) => {
  return (
    <button
      onClick={onClick}
      className={`relative px-6 py-3 text-sm font-bold rounded-t-[14px] border-[3px] transition-all duration-200 ${
        active
          ? 'bg-white text-black border-black border-b-white -mb-[3px] z-10'
          : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200 border-b-[3px] border-b-black'
      }`}
    >
      <span className="flex items-center gap-2">
        {icon && <span>{icon}</span>}
        <span>{label}</span>
        {badge && (
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
            {badge}
          </span>
        )}
      </span>
    </button>
  )
}

export const Tabs = ({ children, className = '' }) => {
  return (
    <div className={`flex gap-1 border-b-[3px] border-black bg-transparent ${className}`}>
      {children}
    </div>
  )
}

export const TabContent = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-b-[20px] rounded-tr-[20px] border-[3px] border-t-0 border-black p-6 ${className}`}>
      {children}
    </div>
  )
}

