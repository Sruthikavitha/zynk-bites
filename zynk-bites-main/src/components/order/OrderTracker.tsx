import { Order, OrderStatus } from '@/types';
import { CheckCircle2, Clock, ChefHat, Truck, Package, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderTrackerProps {
  order: Order;
  showTimestamps?: boolean;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-muted-foreground' },
  scheduled: { label: 'Scheduled', icon: Clock, color: 'text-info' },
  preparing: { label: 'Preparing', icon: ChefHat, color: 'text-warning' },
  ready: { label: 'Ready', icon: Package, color: 'text-accent' },
  picked_up: { label: 'Out for Delivery', icon: Truck, color: 'text-primary' },
  out_for_delivery: { label: 'Out for Delivery', icon: Truck, color: 'text-primary' },
  delivered: { label: 'Delivered', icon: CheckCircle2, color: 'text-accent' },
};

const STATUS_ORDER: OrderStatus[] = ['scheduled', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

export const OrderTracker = ({ order, showTimestamps = false }: OrderTrackerProps) => {
  const currentStatus = order.status === 'picked_up' ? 'out_for_delivery' : order.status;
  const currentIndex = STATUS_ORDER.indexOf(currentStatus as OrderStatus);

  const getStatusTimestamp = (status: OrderStatus): string | null => {
    const historyEntry = order.statusHistory?.find(h => h.status === status);
    if (!historyEntry) return null;
    return new Date(historyEntry.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative mb-4">
        <div className="flex justify-between items-center relative">
          {/* Background line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
          
          {/* Progress line */}
          <div 
            className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
            style={{ width: `${Math.max(0, (currentIndex / (STATUS_ORDER.length - 1)) * 100)}%` }}
          />

          {STATUS_ORDER.map((status, index) => {
            const config = STATUS_CONFIG[status];
            const Icon = config.icon;
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const timestamp = showTimestamps ? getStatusTimestamp(status) : null;

            return (
              <div key={status} className="flex flex-col items-center relative z-10">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                    isCurrent && 'ring-4 ring-primary/20'
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isCurrent ? (
                    <Icon className="w-5 h-5 animate-pulse" />
                  ) : (
                    <CircleDot className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs mt-2 font-medium text-center max-w-[70px]',
                    isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {config.label}
                </span>
                {timestamp && (
                  <span className="text-[10px] text-muted-foreground">{timestamp}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Compact version for lists
export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => {
  const config = STATUS_CONFIG[status === 'picked_up' ? 'out_for_delivery' : status];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-1.5 text-sm font-medium', config.color)}>
      <Icon className="w-4 h-4" />
      <span>{config.label}</span>
    </div>
  );
};