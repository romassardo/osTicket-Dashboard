import React from 'react';

interface BadgeProps {
  children?: React.ReactNode;
  colorScheme?: 'blue' | 'green' | 'red' | 'yellow' | 'gray'; // Add more as needed
  variant?: 'solid' | 'outline' | 'subtle';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  colorScheme = 'gray',
  variant = 'subtle',
  className,
}) => {
  const baseStyle = 'badge';
  const colorStyle = `badge-${colorScheme}`;
  const variantStyle = `badge-${variant}`;

  return (
    <span className={`${baseStyle} ${colorStyle} ${variantStyle} ${className || ''}`.trim()}>
      {children}
    </span>
  );
};

export default Badge;
