import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [count, setCount] = useState(0);

  return React.createElement('div', {
    style: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }
  }, 
    React.createElement('div', {
      style: {
        backgroundColor: 'white',
        padding: '60px',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '600px',
        width: '100%'
      }
    }, [
      React.createElement('h1', {
        key: 'title',
        style: { fontSize: '2.5em', marginBottom: '20px', color: '#1f2937' }
      }, '🎉 ZYNK React App Test'),
      
      React.createElement('p', {
        key: 'description',
        style: { fontSize: '1.2em', color: '#6b7280', marginBottom: '30px' }
      }, 'Testing if React loads properly'),
      
      React.createElement('div', {
        key: 'status',
        style: { marginBottom: '30px' }
      }, [
        React.createElement('div', {
          key: 'react',
          style: {
            backgroundColor: '#dcfce7',
            color: '#166534',
            padding: '10px 15px',
            borderRadius: '8px',
            margin: '5px',
            display: 'inline-block'
          }
        }, '✅ React Working'),
        React.createElement('div', {
          key: 'state',
          style: {
            backgroundColor: '#dcfce7',
            color: '#166534',
            padding: '10px 15px',
            borderRadius: '8px',
            margin: '5px',
            display: 'inline-block'
          },
        }, `✅ State: ${count}`)
      ]),
      
      React.createElement('button', {
        key: 'button',
        onClick: () => setCount(count + 1),
        style: {
          padding: '12px 24px',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          backgroundColor: '#16a34a',
          color: 'white',
          transition: 'all 0.2s'
        }
      }, `Test State (Click: ${count})`)
    ])
  );
}

// Render the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(App));
} else {
  console.error('Root container not found');
}

export default App;
