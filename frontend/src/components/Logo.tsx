import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
}

const Logo: React.FC<LogoProps> = ({ size = 'medium' }) => {
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'logo-small';
      case 'large':
        return 'logo-large';
      default:
        return 'logo-medium';
    }
  };

  return (
    <div className={`logo ${getSizeClass()}`}>
      <span className="logo-text">BCB</span>
      <span className="logo-subtitle">Big Chat Brasil</span>
    </div>
  );
};

export default Logo;
