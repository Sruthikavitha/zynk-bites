import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

// Simple Button Component
const Button = ({ children, onClick, variant = 'primary' }) => {
  const baseStyle = {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  };
  
  const styles = {
    primary: { ...baseStyle, backgroundColor: '#16a34a', color: 'white' },
    secondary: { ...baseStyle, backgroundColor: '#e5e7eb', color: '#374151' }
  };
  
  return React.createElement('button', {
    style: styles[variant],
    onClick: onClick
  }, children);
};

// Main App Component
const App = () => {
  const [step, setStep] = useState('welcome');
  const [count, setCount] = useState(0);

  const content = {
    welcome: {
      title: '🎉 ZYNK Application is Working!',
      description: 'Complete payment integration coming next...',
      actions: [
        { text: 'Test React State', onClick: () => setCount(count + 1) },
        { text: 'Start Registration', onClick: () => setStep('registration') }
      ]
    },
    registration: {
      title: '📝 Registration Flow',
      description: 'Multi-step registration with payment integration',
      actions: [
        { text: 'Back to Welcome', onClick: () => setStep('welcome') },
        { text: 'Add Payment Modal', onClick: () => setStep('payment') }
      ]
    },
    payment: {
      title: '💳 Payment Integration',
      description: 'Real Razorpay payment processing',
      actions: [
        { text: 'Back to Registration', onClick: () => setStep('registration') },
        { text: 'Complete Setup', onClick: () => setStep('complete') }
      ]
    },
    complete: {
      title: '🚀 Setup Complete!',
      description: 'Full application with real payment processing',
      actions: [
        { text: 'Start Over', onClick: () => setStep('welcome') }
      ]
    }
  };

  const current = content[step];

  return React.createElement('div', {
    style: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }
  }, 
    React.createElement('div', {
      style: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
      }, current.title),
      
      React.createElement('p', {
        key: 'description',
        style: { fontSize: '1.2em', color: '#6b7280', marginBottom: '30px' }
      }, current.description),
      
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
        }, `✅ State: ${count}`),
        React.createElement('div', {
          key: 'step',
          style: {
            backgroundColor: '#dcfce7',
            color: '#166534',
            padding: '10px 15px',
          borderRadius: '8px',
          margin: '5px',
          display: 'inline-block'
        }, `✅ Step: ${step}`)
      ]),
      
      React.createElement('div', {
        key: 'actions',
        style: { display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }
      }, current.actions.map((action, index) => 
        React.createElement(Button, {
          key: index,
          onClick: action.onClick,
          variant: index === 0 ? 'primary' : 'secondary'
        }, action.text)
      ))
    ])
  );
};

// Render the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(App));
} else {
  console.error('Root container not found');
}
