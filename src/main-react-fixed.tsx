import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [count, setCount] = useState(0);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    },
    card: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: '60px',
      borderRadius: '20px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      textAlign: 'center',
      maxWidth: '600px',
      width: '100%'
    },
    title: {
      fontSize: '2.5em',
      marginBottom: '20px',
      color: '#1f2937'
    },
    description: {
      fontSize: '1.2em',
      color: '#6b7280',
      marginBottom: '30px'
    },
    statusContainer: {
      marginBottom: '30px'
    },
    statusBadge: {
      backgroundColor: '#dcfce7',
      color: '#166534',
      padding: '10px 15px',
      borderRadius: '8px',
      margin: '5px',
      display: 'inline-block'
    },
    button: {
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
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎉 ZYNK React App Working!</h1>
        
        <p style={styles.description}>
          React state management and components working perfectly!
        </p>
        
        <div style={styles.statusContainer}>
          <div style={styles.statusBadge}>✅ React Working</div>
          <div style={styles.statusBadge}>✅ State: {count}</div>
        </div>
        
        <button style={styles.button} onClick={() => setCount(count + 1)}>
          Test State (Click: {count})
        </button>
      </div>
    </div>
  );
}

// Render the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('Root container not found');
}
