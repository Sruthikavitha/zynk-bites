import { Button } from '@/components/ui/button';

const TestSubscribe = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Subscribe Test Page</h1>
        <p className="text-gray-600 mb-8">Subscribe page is working!</p>
        
        <Button className="bg-green-600 hover:bg-green-700">
          Subscribe Test Working
        </Button>
      </div>
    </div>
  );
};

export default TestSubscribe;
