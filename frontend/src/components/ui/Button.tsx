import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean; // Para estados de carga
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = [
    'inline-flex items-center justify-center',
    'rounded-lg font-semibold',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'transition-colors duration-150 ease-in-out',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ];

  const variantStyles = {
    primary: [
      'bg-[#00d9ff] text-white',
      'hover:bg-[#00c3e6]', // Un poco más oscuro para hover
      'focus-visible:ring-[#00d9ff]',
      'dark:bg-accent-primary dark:hover:bg-opacity-90 dark:focus-visible:ring-accent-primary',
    ],
    secondary: [
      'bg-[#1a1f29] text-[#b8c5d6] border border-[#252a35]',
      'hover:bg-[#252a35]',
      'focus-visible:ring-[#7c3aed]',
      'dark:bg-bg-secondary dark:text-text-secondary dark:border-bg-tertiary dark:hover:bg-bg-tertiary dark:focus-visible:ring-accent-secondary',
      // TODO: Add light mode styles from DESIGN_GUIDE if needed
    ],
    danger: [
      'bg-[#ef4444] text-white',
      'hover:bg-red-700',
      'focus-visible:ring-[#ef4444]',
      'dark:bg-error dark:hover:bg-red-700 dark:focus-visible:ring-error',
    ],
    ghost: [
      'bg-transparent text-[#00d9ff]',
      'hover:bg-[#00d9ff] hover:bg-opacity-10',
      'focus-visible:ring-[#00d9ff]',
      'dark:text-accent-primary dark:hover:bg-accent-primary dark:hover:bg-opacity-10 dark:focus-visible:ring-accent-primary',
    ],
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const iconBaseStyle = 'flex items-center justify-center';
  const iconLeftStyle = children ? 'mr-2' : '';
  const iconRightStyle = children ? 'ml-2' : '';

  const combinedClassName = [
    ...baseStyles,
    ...variantStyles[variant],
    sizeStyles[size],
    className || '',
  ].join(' ').trim();

  return (
    <button
      className={combinedClassName}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <>
          {leftIcon && <span className={`${iconBaseStyle} ${iconLeftStyle}`}>{leftIcon}</span>}
          {children}
          {rightIcon && <span className={`${iconBaseStyle} ${iconRightStyle}`}>{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;

