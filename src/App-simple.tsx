import React from 'react';

function App() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '40px', 
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#333', marginBottom: '20px' }}>
          🎉 ZYNK Application is Working!
        </h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          If you can see this page, the basic React setup is working correctly.
        </p>
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ 
            backgroundColor: '#e8f5e8', 
            padding: '10px 15px', 
            borderRadius: '4px',
            color: '#2d5a2d'
          }}>
            ✅ React Working
          </div>
          <div style={{ 
            backgroundColor: '#e8f5e8', 
            padding: '10px 15px', 
            borderRadius: '4px',
            color: '#2d5a2d'
          }}>
            ✅ CSS Loading
          </div>
          <div style={{ 
            backgroundColor: '#e8f5e8', 
            padding: '10px 15px', 
            borderRadius: '4px',
            color: '#2d5a2d'
          }}>
            ✅ No White Screen
          </div>
        </div>
        <p style={{ marginTop: '20px', fontSize: '14px', color: '#999' }}>
          Port: {window.location.port}
        </p>
      </div>
    </div>
  );
}

export default App;
