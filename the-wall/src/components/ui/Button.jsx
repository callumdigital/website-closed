import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  onClick, 
  disabled = false,
  type = 'button',
  className = '',
  fullWidth = false,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center text-center transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-bold';
  
  const variants = {
    primary: 'bg-[#F4C542] text-black hover:bg-[#E5B73B] border-[3px] border-black',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600 border-[3px] border-black',
    success: 'bg-green-500 text-white hover:bg-green-600 border-[3px] border-black',
    danger: 'bg-red-500 text-white hover:bg-red-600 border-[3px] border-black',
    warning: 'bg-yellow-500 text-black hover:bg-yellow-600 border-[3px] border-black',
    outline: 'border-[3px] border-black text-black hover:bg-gray-50 bg-transparent',
    ghost: 'text-gray-600 hover:text-gray-900 hover:underline border-0'
  };
  
  const sizes = {
    small: 'px-3 py-2 text-sm rounded-[14px]',
    medium: 'px-4 py-3 text-base rounded-[14px]',
    large: 'px-6 py-4 text-lg rounded-[14px]',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`;
  
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

