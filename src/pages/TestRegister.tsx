import { useState } from 'react';
import { Button } from '@/components/ui/button';

const TestRegister = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Test Page</h1>
        <p className="text-gray-600 mb-8">If you can see this, the app is working!</p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => setCount(count + 1)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Count: {count}
          </Button>
          
          <div className="text-sm text-gray-500">
            <p>✅ React is working</p>
            <p>✅ Components are loading</p>
            <p>✅ No white screen issue</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRegister;
