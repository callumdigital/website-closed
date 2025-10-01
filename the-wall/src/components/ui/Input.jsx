import React from 'react';

const Input = ({ 
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  helpText,
  maxLength,
  minLength,
  required = false,
  disabled = false,
  error,
  className = '',
  rows = 4,
  showCharacterCount = false,
  id,
  ...props 
}) => {
  const inputClasses = `
    w-full px-4 py-3 border-[3px] rounded-[14px] transition-colors duration-200 leading-normal
    focus:outline-none focus:border-black
    disabled:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50
    ${error ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-black bg-[#F5E6D3]'}
    ${className}
  `;
  
  const charCount = (maxLength && value) ? `${value.length}/${maxLength}` : null;
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="block text-base font-bold text-gray-900 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {type === 'textarea' ? (
          <textarea
            id={inputId}
            className={`${inputClasses} resize-none`}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            maxLength={maxLength}
            minLength={minLength}
            required={required}
            disabled={disabled}
            rows={rows}
            {...props}
          />
        ) : (
          <input
            id={inputId}
            type={type}
            className={inputClasses}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            maxLength={maxLength}
            minLength={minLength}
            required={required}
            disabled={disabled}
            {...props}
          />
        )}
        
        {showCharacterCount && charCount && (
          <div className="absolute right-3 top-3 text-xs text-gray-500 pointer-events-none">
            {charCount}
          </div>
        )}
      </div>
      
      {helpText && !error && (
        <p className="text-sm text-gray-600">{helpText}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;

