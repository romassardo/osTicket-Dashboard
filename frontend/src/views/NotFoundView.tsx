import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen" style={{ background: 'var(--bg-primary)' }}>
      <h1 className="font-display" style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '0.5rem', letterSpacing: '-0.04em' }}>404</h1>
      <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Página No Encontrada</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Lo sentimos, la página que buscas no existe o ha sido movida.</p>
      <Link 
        to="/"
        style={{ padding: '0.65rem 1.5rem', background: 'var(--accent-primary)', color: 'var(--bg-primary)', fontWeight: 600, borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', textDecoration: 'none', fontFamily: 'var(--font-body)', fontSize: '0.875rem', transition: 'all 150ms ease' }}
      >
        Volver al Inicio
      </Link>
    </div>
  );
};

export default NotFoundView;
