import { Star, Flag, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Review } from '@/types';

interface ReviewCardProps {
  review: Review;
  showModerationControls?: boolean;
  onModerate?: (reviewId: string, hide: boolean) => void;
}

export const ReviewCard = ({ review, showModerationControls = false, onModerate }: ReviewCardProps) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      className={cn(
        'p-4 rounded-2xl border',
        review.isHidden ? 'bg-muted/50 border-destructive/30' : 'bg-secondary/50 border-border/40'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'w-4 h-4',
                    star <= review.rating
                      ? 'fill-warning text-warning'
                      : 'text-muted-foreground/30'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
            {review.isHidden && (
              <Badge variant="destructive" className="text-xs">
                <EyeOff className="w-3 h-3 mr-1" />
                Hidden
              </Badge>
            )}
          </div>
          
          <p className="font-medium text-sm mb-1">{review.mealName}</p>
          
          {review.comment && (
            <p className="text-sm text-muted-foreground">{review.comment}</p>
          )}

          {review.isHidden && review.hiddenReason && (
            <p className="text-xs text-destructive mt-2">
              Reason: {review.hiddenReason}
            </p>
          )}
        </div>

        {showModerationControls && onModerate && (
          <div className="flex gap-1">
            {review.isHidden ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onModerate(review.id, false)}
                className="text-accent"
              >
                <Eye className="w-4 h-4 mr-1" />
                Restore
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onModerate(review.id, true)}
                className="text-destructive"
              >
                <Flag className="w-4 h-4 mr-1" />
                Hide
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};