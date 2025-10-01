import React from 'react'

const NewProjectCard = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-[#F4C542] rounded-[20px] border-[3px] border-black border-dashed p-6 cursor-pointer transition-all duration-200 hover:translate-y-[-4px] hover:bg-[#E5B73B] flex flex-col items-center justify-center min-h-[280px]"
    >
      <div className="text-6xl mb-4">+</div>
      <h3 className="text-xl font-bold text-gray-900 admin-heading">
        Create New Project
      </h3>
      <p className="text-sm text-gray-700 mt-2">
        Start a new wall for your team
      </p>
    </div>
  )
}

export default NewProjectCard

