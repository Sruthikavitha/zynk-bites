import { formatDistanceToNow } from 'date-fns';
import { BellDot, ChefHat, ShieldAlert, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/use-notifications';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AppNotification, UserRole } from '@/types';

const roleConfig: Record<
  UserRole,
  {
    title: string;
    description: string;
    emptyText: string;
    icon: typeof UserRound;
  }
> = {
  customer: {
    title: 'Your Updates',
    description: 'Payments, delivery progress, and meal reminders',
    emptyText: 'Your next payment, meal, or delivery update will show up here.',
    icon: UserRound,
  },
  chef: {
    title: 'Kitchen Alerts',
    description: 'Subscribers, menu changes, and tomorrow’s meal count',
    emptyText: 'Subscriber and kitchen updates will appear here once orders start moving.',
    icon: ChefHat,
  },
  admin: {
    title: 'Admin Alerts',
    description: 'Chef approvals and operational notifications',
    emptyText: 'Approval requests and system alerts will appear here.',
    icon: ShieldAlert,
  },
  delivery: {
    title: 'Delivery Alerts',
    description: 'Operational updates for the delivery team',
    emptyText: 'Delivery-related updates will appear here.',
    icon: BellDot,
  },
};

const labelMap: Record<AppNotification['priority'], string> = {
  critical: 'Critical',
  normal: 'New',
};

export const NotificationHighlightsCard = ({ role }: { role: UserRole }) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const config = roleConfig[role];
  const Icon = config.icon;
  const items = notifications.slice(0, 4);

  const handleSelect = async (notification: AppNotification) => {
    if (!notification.readAt) {
      await markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <Card className="card-base mb-6 animate-slide-up">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="font-display flex items-center gap-2 text-lg">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Icon className="h-4 w-4" />
              </span>
              {config.title}
            </CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
          {unreadCount > 0 && <Badge className="rounded-full bg-emerald-600">{unreadCount} unread</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && <p className="text-sm text-slate-500">{config.emptyText}</p>}
        {items.map((notification) => (
          <button
            key={notification.id}
            type="button"
            onClick={() => void handleSelect(notification)}
            className={`w-full rounded-2xl border p-3 text-left transition-all hover:shadow-sm ${
              notification.readAt ? 'border-slate-200 bg-white' : 'border-emerald-200 bg-emerald-50/70'
            }`}
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge variant={notification.priority === 'critical' ? 'destructive' : 'secondary'} className="rounded-full">
                  {labelMap[notification.priority]}
                </Badge>
                <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
              </div>
              <p className="text-[11px] text-slate-500">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </p>
            </div>
            <p className="text-sm text-slate-600">{notification.message}</p>
          </button>
        ))}
        {notifications.length > 4 && (
          <p className="text-center text-sm text-emerald-700">Open the bell above to view the full activity feed.</p>
        )}
      </CardContent>
    </Card>
  );
};
