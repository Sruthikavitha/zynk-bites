import { useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, Building, Lock, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onSuccess: (razorpayResponse?: any) => void;
}

const PaymentModal = ({ isOpen, onClose, amount, onSuccess }: PaymentModalProps) => {
  console.log('PaymentModal rendered with props:', { isOpen, amount, onSuccess });
  
  const [activeTab, setActiveTab] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Card form states
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [saveCard, setSaveCard] = useState(false);

  // UPI form states
  const [upiId, setUpiId] = useState("");

  // Netbanking form states
  const [selectedBank, setSelectedBank] = useState("");

  const banks = [
    "HDFC Bank", "ICICI Bank", "State Bank of India", "Punjab National Bank",
    "Bank of Baroda", "Canara Bank", "Union Bank of India", "Axis Bank",
    "IDFC First Bank", "Kotak Mahindra Bank", "IndusInd Bank", "Yes Bank"
  ];

  const popularUpiApps = [
    { name: "PhonePe", icon: "📱" },
    { name: "Google Pay", icon: "📱" },
    { name: "Paytm", icon: "📱" },
    { name: "Amazon Pay", icon: "📱" }
  ];

  const { toast } = useToast();

  // Load Razorpay script
  const loadRazorpayScript = (): Promise<void> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  };

  // Format card number
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Format expiry date
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  // Handle card payment
  const handleCardPayment = async () => {
    if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
      toast({
        title: "Error",
        description: "Please fill in all card details",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      await loadRazorpayScript();
      
      // Use test key for immediate testing (replace with env var in production)
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_STz4joVjA8LzYP';
      if (!razorpayKey) {
        throw new Error('Razorpay key not configured');
      }

      // Create order on backend first
      let apiBase = import.meta.env.VITE_API_BASE_URL || `http://localhost:3003`;
      if (apiBase.endsWith('/api')) apiBase = apiBase.replace(/\/api\/?$/, '');

      console.log('Creating payment order at:', `${apiBase}/api/payment/create-order`);

      const orderRes = await fetch(`${apiBase}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to paise
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
        }),
      });

      if (!orderRes.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await orderRes.json();

      const options = {
        key: razorpayKey,
        amount: amount * 100,
        currency: 'INR',
        name: 'ZYNK Bites',
        description: 'Subscription payment',
        order_id: orderData.order.id,
        handler: function (response: any) {
          setPaymentSuccess(true);
          setTimeout(() => {
            onSuccess(response);
            onClose();
            setPaymentSuccess(false);
          }, 1500);
        },
        prefill: {
          contact: '',
          email: '',
        },
        theme: { color: '#16a34a' },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          },
          escape: false,
          backdropclose: false,
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Payment processing failed",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle UPI payment
  const handleUpiPayment = async () => {
    if (!upiId) {
      toast({
        title: "Error",
        description: "Please enter your UPI ID",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      await loadRazorpayScript();
      
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_STz4joVjA8LzYP';
      if (!razorpayKey) {
        throw new Error('Razorpay key not configured');
      }

      // Create order on backend first
      let apiBase = import.meta.env.VITE_API_BASE_URL || `http://localhost:3003`;
      if (apiBase.endsWith('/api')) apiBase = apiBase.replace(/\/api\/?$/, '');

      const orderRes = await fetch(`${apiBase}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
        }),
      });

      if (!orderRes.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await orderRes.json();

      const options = {
        key: razorpayKey,
        amount: amount * 100,
        currency: 'INR',
        name: 'ZYNK Bites',
        description: 'Subscription payment',
        order_id: orderData.order.id,
        handler: function (response: any) {
          setPaymentSuccess(true);
          setTimeout(() => {
            onSuccess(response);
            onClose();
            setPaymentSuccess(false);
          }, 1500);
        },
        prefill: {
          contact: upiId,
          email: '',
        },
        theme: { color: '#16a34a' },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          },
          escape: false,
          backdropclose: false,
        },
        method: 'upi',
        'upi[vpa]': upiId,
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Payment processing failed",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Netbanking payment
  const handleNetbankingPayment = async () => {
    if (!selectedBank) {
      toast({
        title: "Error",
        description: "Please select your bank",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      await loadRazorpayScript();
      
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_STz4joVjA8LzYP';
      if (!razorpayKey) {
        throw new Error('Razorpay key not configured');
      }

      // Create order on backend first
      let apiBase = import.meta.env.VITE_API_BASE_URL || `http://localhost:3003`;
      if (apiBase.endsWith('/api')) apiBase = apiBase.replace(/\/api\/?$/, '');

      const orderRes = await fetch(`${apiBase}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
        }),
      });

      if (!orderRes.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await orderRes.json();

      const options = {
        key: razorpayKey,
        amount: amount * 100,
        currency: 'INR',
        name: 'ZYNK Bites',
        description: 'Subscription payment',
        order_id: orderData.order.id,
        handler: function (response: any) {
          setPaymentSuccess(true);
          setTimeout(() => {
            onSuccess(response);
            onClose();
            setPaymentSuccess(false);
          }, 1500);
        },
        prefill: {
          contact: '',
          email: '',
        },
        theme: { color: '#16a34a' },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          },
          escape: false,
          backdropclose: false,
        },
        method: 'netbanking',
        bank: selectedBank,
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Payment processing failed",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
            <p className="text-gray-600 mt-2">Amount: ₹{amount.toLocaleString('en-IN')}</p>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="card" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Card
            </TabsTrigger>
            <TabsTrigger value="upi" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              UPI
            </TabsTrigger>
            <TabsTrigger value="netbanking" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Netbanking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="space-y-4">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={formatCardNumber(cardNumber)}
                    onChange={(e) => setCardNumber(e.target.value)}
                    maxLength={19}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    placeholder="John Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={formatExpiry(cardExpiry)}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={4}
                      type="password"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="saveCard"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="saveCard" className="text-sm text-gray-600">
                    Save card for future payments
                  </Label>
                </div>

                <Button 
                  onClick={handleCardPayment} 
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </div>
                  ) : (
                    `Pay ₹${amount.toLocaleString('en-IN')}`
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upi" className="space-y-4">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="upiId">UPI ID</Label>
                  <Input
                    id="upiId"
                    placeholder="yourupi@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {popularUpiApps.map((app) => (
                    <Button
                      key={app.name}
                      variant="outline"
                      className="h-12"
                      onClick={() => setUpiId(`${app.name.toLowerCase().replace(' ', '')}@ybl`)}
                    >
                      <span className="mr-2">{app.icon}</span>
                      {app.name}
                    </Button>
                  ))}
                </div>

                <Button 
                  onClick={handleUpiPayment} 
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </div>
                  ) : (
                    `Pay ₹${amount.toLocaleString('en-IN')} via UPI`
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="netbanking" className="space-y-4">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="bank">Select Bank</Label>
                  <Select value={selectedBank} onValueChange={setSelectedBank}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleNetbankingPayment} 
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </div>
                  ) : (
                    `Pay ₹${amount.toLocaleString('en-IN')} via Netbanking`
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Success Overlay */}
        {paymentSuccess && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/95 rounded-2xl">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Payment Successful!</h3>
              <p className="mt-1 text-sm text-gray-600">Your payment has been processed successfully.</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
