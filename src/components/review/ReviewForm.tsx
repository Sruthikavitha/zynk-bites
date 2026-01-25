import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Order } from '@/types';

interface ReviewFormProps {
  order: Order;
  onSubmit: (rating: number, comment?: string) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export const ReviewForm = ({ order, onSubmit, onCancel, isSubmitting = false }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit(rating, comment.trim() || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 rounded-lg bg-secondary/50">
        <p className="text-sm text-muted-foreground mb-1">Your order</p>
        <p className="font-medium">{order.mealName}</p>
        {order.chefName && (
          <p className="text-sm text-muted-foreground">by {order.chefName}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Your Rating *</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="p-1 transition-transform hover:scale-110"
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
            >
              <Star
                className={cn(
                  'w-8 h-8 transition-colors',
                  (hoveredRating || rating) >= star
                    ? 'fill-warning text-warning'
                    : 'text-muted-foreground/30'
                )}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-muted-foreground">
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent!'}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Your Review (Optional)</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this meal..."
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">{comment.length}/500</p>
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Later
          </Button>
        )}
        <Button
          type="submit"
          disabled={rating === 0 || isSubmitting}
          className="flex-1 gradient-primary"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
};

// Star display component for showing ratings
export const StarRating = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            star <= Math.round(rating)
              ? 'fill-warning text-warning'
              : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  );
};