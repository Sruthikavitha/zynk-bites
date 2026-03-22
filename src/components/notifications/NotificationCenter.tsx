import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { AppNotification } from '@/types';

const typeLabelMap: Record<AppNotification['type'], string> = {
  subscription_success: 'Subscription',
  payment_failed: 'Payment',
  meal_reminder: 'Meal reminder',
  daily_meal_count: 'Meal count',
  skip_swap_deadline: 'Cutoff',
  delivery_update: 'Delivery',
  new_subscriber: 'Subscriber',
  chef_menu_update: 'Kitchen',
  chef_pending_approval: 'Approval',
  chef_approved: 'Approval',
  system_alert: 'System',
};

const itemTone = (item: AppNotification) =>
  item.priority === 'critical'
    ? 'border-rose-200 bg-rose-50/80'
    : !item.readAt
      ? 'border-emerald-200 bg-emerald-50/70'
      : 'border-slate-200 bg-white';

export const NotificationCenter = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleSelect = async (notification: AppNotification) => {
    if (!notification.readAt) {
      await markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }

    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full border border-gray-200 bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
        >
          {unreadCount > 0 ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            <p className="text-xs text-slate-500">Live updates from payments, meals, and approvals</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => void markAllAsRead()}>
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Read all
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[360px]">
          <div className="space-y-3 p-3">
            {isLoading && notifications.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Loading notifications...
              </p>
            )}

            {!isLoading && notifications.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                No notifications yet.
              </p>
            )}

            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => void handleSelect(notification)}
                className={`w-full rounded-2xl border p-3 text-left transition-all hover:shadow-sm ${itemTone(notification)}`}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={notification.priority === 'critical' ? 'destructive' : 'secondary'} className="rounded-full">
                        {typeLabelMap[notification.type]}
                      </Badge>
                      {!notification.readAt && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                  </div>
                  <p className="shrink-0 text-[11px] text-slate-500">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <p className="text-sm leading-5 text-slate-600">{notification.message}</p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
