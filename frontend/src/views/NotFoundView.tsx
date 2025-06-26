import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-bg-primary">
      <h1 className="text-6xl font-bold text-accent-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Página No Encontrada</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">Lo sentimos, la página que buscas no existe o ha sido movida.</p>
      <Link 
        to="/"
        className="px-6 py-3 bg-accent-primary text-white font-semibold rounded-lg shadow hover:bg-opacity-90 transition-colors"
      >
        Volver al Inicio
      </Link>
    </div>
  );
};

export default NotFoundView;
