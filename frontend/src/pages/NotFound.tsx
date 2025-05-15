import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleGoToLogin = () => {
    navigate('/');
  };

  return (
    <div className="not-found-container card-shadow">
      <Logo size="medium" />
      <div className="not-found-content">
        <h2>Página não encontrada</h2>
        <p>A página que você está procurando não existe ou foi movida.</p>
        <div className="error-code">404</div>
        <button onClick={handleGoToLogin} className="primary-button">
          Ir para a página de login
        </button>
      </div>
    </div>
  );
};

export default NotFound;
