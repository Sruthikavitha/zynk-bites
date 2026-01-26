import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, X } from 'lucide-react';
import { ReviewForm } from './ReviewForm';
import type { Order } from '@/types';

interface ReviewPromptProps {
  orders: Order[];
  onSubmitReview: (orderId: string, rating: number, comment?: string) => void;
  onDismiss?: (orderId: string) => void;
}

export const ReviewPrompt = ({ orders, onSubmitReview, onDismiss }: ReviewPromptProps) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (orders.length === 0) return null;

  const handleSubmit = async (rating: number, comment?: string) => {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    await onSubmitReview(selectedOrder.id, rating, comment);
    setIsSubmitting(false);
    setSelectedOrder(null);
  };

  return (
    <>
      <Card className="mb-6 shadow-soft border-primary/20 bg-secondary/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            How was your meal?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Help us improve by rating your delivered meals
          </p>
          <div className="space-y-2">
            {orders.slice(0, 3).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background border"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{order.mealName}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.chefName} • {new Date(order.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {onDismiss && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDismiss(order.id)}
                      className="text-muted-foreground"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedOrder(order)}
                    className="text-warning border-warning hover:bg-warning/10"
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Rate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Rate Your Meal</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <ReviewForm
              order={selectedOrder}
              onSubmit={handleSubmit}
              onCancel={() => setSelectedOrder(null)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};