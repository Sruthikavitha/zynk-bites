import React from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  return React.createElement('div', {
    style: {
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, 
    React.createElement('div', {
      style: {
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }
    }, [
      React.createElement('h1', { key: 'title', style: { color: '#333', marginBottom: '20px' } }, '🎉 React App Working!'),
      React.createElement('p', { key: 'desc', style: { color: '#666', marginBottom: '20px' } }, 'If you can see this, React is working correctly.'),
      React.createElement('div', { key: 'badges', style: { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' } }, [
        React.createElement('span', { key: 'react', style: { backgroundColor: '#e8f5e8', padding: '10px 15px', borderRadius: '4px', color: '#2d5a2d' } }, '✅ React Working'),
        React.createElement('span', { key: 'dom', style: { backgroundColor: '#e8f5e8', padding: '10px 15px', borderRadius: '4px', color: '#2d5a2d' } }, '✅ DOM Working'),
        React.createElement('span', { key: 'server', style: { backgroundColor: '#e8f5e8', padding: '10px 15px', borderRadius: '4px', color: '#2d5a2d' } }, '✅ Server Working')
      ]),
      React.createElement('p', { key: 'port', style: { marginTop: '20px', fontSize: '14px', color: '#999' } }, `Port: ${typeof window !== 'undefined' ? window.location.port : 'Unknown'}`)
    ])
  );
};

// Simple render without any dependencies
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(App));
} else {
  console.error('Root container not found');
}
