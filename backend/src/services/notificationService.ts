import type { Pool } from 'pg';
import { getPool } from '../config/database.js';
import { getDailyMealsBySubscriptionId } from '../models/dailyMealQueries.js';
import { createNotification, findNotificationByDedupeKey } from '../models/notificationQueries.js';
import { getOrdersByDate } from '../models/orderQueries.js';
import { getActiveSubscriptions } from '../models/subscriptionQueries.js';
import { Notification, NotificationPriority, NotificationType, UserRole } from '../models/schema.js';
import { getUserById, getUsersByRole } from '../models/userQueries.js';
import { getCutoffForDate } from '../utils/mealSchedule.js';

type NotificationMetadata = Record<string, unknown>;

type QueueNotificationInput = {
  recipientId: number;
  recipientRole: UserRole;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
  metadata?: NotificationMetadata;
  priority?: NotificationPriority;
  scheduledFor?: Date;
  dedupeKey?: string;
  maxAttempts?: number;
};

type QueueRoleNotificationInput = Omit<QueueNotificationInput, 'recipientId' | 'recipientRole'> & {
  role: UserRole;
  onlyActive?: boolean;
};

type SubscriptionSuccessInput = {
  customerId: number;
  chefId?: number | null;
  planName: string;
  paymentId: string;
};

type PaymentFailureInput = {
  customerId?: number | null;
  planName?: string | null;
  reason: string;
};

type ChefMenuUpdateInput = {
  chefId?: number | null;
  customerId: number;
  customerName?: string | null;
  date: string;
  changeType: 'skip' | 'unskip' | 'swap' | 'address_change';
  mealName?: string | null;
};

type DeliveryUpdateInput = {
  customerId: number;
  orderId: number;
  mealName: string;
  status: 'scheduled' | 'preparing' | 'ready' | 'picked_up' | 'out_for_delivery' | 'delivered';
};

type QueuedNotificationRow = {
  id: number;
  status: 'queued' | 'processing' | 'delivered' | 'failed';
  channel: 'in_app';
  attempts: number;
  max_attempts: number;
};

const PROCESS_INTERVAL_MS = 5_000;
const SCHEDULER_INTERVAL_MS = 60_000;
const RETRY_BASE_DELAY_MS = 2 * 60 * 1000;
const STALE_PROCESSING_MS = 10 * 60 * 1000;
const PROCESS_BATCH_SIZE = 25;

let workerStarted = false;
let processTimer: NodeJS.Timeout | null = null;
let schedulerTimer: NodeJS.Timeout | null = null;

const safelyRunNotificationTask = async (label: string, task: () => Promise<void>) => {
  try {
    await task();
  } catch (error) {
    console.error(`${label} failed:`, error);
  }
};

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const toScheduledTime = (targetDate: Date, hours: number, minutes: number) => {
  const scheduled = new Date(targetDate);
  scheduled.setHours(hours, minutes, 0, 0);
  return scheduled;
};

const sanitizeSchedule = (scheduledFor: Date, now = new Date()) =>
  scheduledFor.getTime() < now.getTime() ? now : scheduledFor;

export const queueNotification = async (input: QueueNotificationInput): Promise<Notification> => {
  if (input.dedupeKey) {
    const existing = await findNotificationByDedupeKey(input.dedupeKey);
    if (existing) return existing;
  }

  return await createNotification({
    recipientId: input.recipientId,
    recipientRole: input.recipientRole,
    type: input.type,
    channel: 'in_app',
    priority: input.priority ?? 'normal',
    title: input.title,
    message: input.message,
    actionUrl: input.actionUrl ?? null,
    metadata: input.metadata ?? {},
    status: 'queued',
    scheduledFor: input.scheduledFor ?? new Date(),
    maxAttempts: input.maxAttempts ?? 3,
    dedupeKey: input.dedupeKey ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

export const queueRoleNotification = async (input: QueueRoleNotificationInput): Promise<Notification[]> => {
  const recipients = await getUsersByRole(input.role, input.onlyActive ?? true);
  const created: Notification[] = [];

  for (const recipient of recipients) {
    const notification = await queueNotification({
      recipientId: recipient.id,
      recipientRole: input.role,
      type: input.type,
      title: input.title,
      message: input.message,
      actionUrl: input.actionUrl,
      metadata: input.metadata,
      priority: input.priority,
      scheduledFor: input.scheduledFor,
      maxAttempts: input.maxAttempts,
      dedupeKey: input.dedupeKey ? `${input.dedupeKey}:${recipient.id}` : undefined,
    });
    created.push(notification);
  }

  return created;
};

export const notifySubscriptionSuccess = async ({
  customerId,
  chefId,
  planName,
  paymentId,
}: SubscriptionSuccessInput) => {
  await safelyRunNotificationTask('notifySubscriptionSuccess', async () => {
    const customer = await getUserById(customerId);
    const paymentSuffix = paymentId.slice(-6);

    await queueNotification({
      recipientId: customerId,
      recipientRole: 'customer',
      type: 'subscription_success',
      title: 'Subscription activated',
      message: `Your ${planName} plan is live. Razorpay payment ${paymentSuffix} was verified successfully.`,
      actionUrl: '/dashboard',
      metadata: { planName, paymentId },
      priority: 'normal',
      dedupeKey: `subscription-success:${customerId}:${paymentId}`,
    });

    if (!chefId) return;

    await queueNotification({
      recipientId: chefId,
      recipientRole: 'chef',
      type: 'new_subscriber',
      title: 'New subscriber added',
      message: `${customer?.fullName || 'A customer'} joined your ${planName} plan.`,
      actionUrl: '/dashboard',
      metadata: { customerId, planName, paymentId },
      priority: 'normal',
      dedupeKey: `new-subscriber:${chefId}:${customerId}:${paymentId}`,
    });
  });
};

export const notifyPaymentFailure = async ({ customerId, planName, reason }: PaymentFailureInput) => {
  await safelyRunNotificationTask('notifyPaymentFailure', async () => {
    if (customerId) {
      await queueNotification({
        recipientId: customerId,
        recipientRole: 'customer',
        type: 'payment_failed',
        title: 'Payment did not go through',
        message: `We could not complete${planName ? ` your ${planName} plan payment` : ' your payment'}. ${reason}`,
        actionUrl: '/checkout',
        metadata: { planName, reason },
        priority: 'critical',
        maxAttempts: 4,
      });
    }

    await queueRoleNotification({
      role: 'admin',
      type: 'system_alert',
      title: 'Payment failure detected',
      message: customerId
        ? `Customer #${customerId} hit a Razorpay payment failure. ${reason}`
        : `A Razorpay payment failure occurred. ${reason}`,
      actionUrl: '/admin',
      metadata: { customerId, planName, reason },
      priority: 'critical',
      maxAttempts: 4,
    });
  });
};

export const notifyChefApprovalRequested = async (chefId: number, chefName: string) => {
  await safelyRunNotificationTask('notifyChefApprovalRequested', async () => {
    await queueRoleNotification({
      role: 'admin',
      type: 'chef_pending_approval',
      title: 'Chef approval pending',
      message: `${chefName} submitted a new chef application and is waiting for review.`,
      actionUrl: '/admin',
      metadata: { chefId, chefName },
      priority: 'critical',
      dedupeKey: `chef-pending-approval:${chefId}`,
    });
  });
};

export const notifyChefApproved = async (chefId: number) => {
  await safelyRunNotificationTask('notifyChefApproved', async () => {
    await queueNotification({
      recipientId: chefId,
      recipientRole: 'chef',
      type: 'chef_approved',
      title: 'You are approved',
      message: 'Your chef profile is approved and now visible to customers.',
      actionUrl: '/chef-partner',
      metadata: { chefId },
      priority: 'critical',
      dedupeKey: `chef-approved:${chefId}`,
    });
  });
};

export const notifyChefMenuUpdate = async ({
  chefId,
  customerId,
  customerName,
  date,
  changeType,
  mealName,
}: ChefMenuUpdateInput) => {
  await safelyRunNotificationTask('notifyChefMenuUpdate', async () => {
    if (!chefId) return;

    const changeLabelMap: Record<ChefMenuUpdateInput['changeType'], string> = {
      skip: 'skipped a meal',
      unskip: 'restored a skipped meal',
      swap: 'swapped a meal',
      address_change: 'updated a delivery address',
    };

    const mealSuffix = mealName ? ` for ${mealName}` : '';

    await queueNotification({
      recipientId: chefId,
      recipientRole: 'chef',
      type: 'chef_menu_update',
      title: 'Customer menu updated',
      message: `${customerName || `Customer #${customerId}`} ${changeLabelMap[changeType]}${mealSuffix} for ${date}.`,
      actionUrl: '/dashboard',
      metadata: { customerId, date, changeType, mealName },
      priority: 'normal',
    });
  });
};

export const notifyDeliveryUpdate = async ({ customerId, orderId, mealName, status }: DeliveryUpdateInput) => {
  await safelyRunNotificationTask('notifyDeliveryUpdate', async () => {
    const statusLabelMap: Record<DeliveryUpdateInput['status'], string> = {
      scheduled: 'scheduled',
      preparing: 'being prepared',
      ready: 'ready for pickup',
      picked_up: 'picked up by delivery',
      out_for_delivery: 'out for delivery',
      delivered: 'delivered',
    };

    await queueNotification({
      recipientId: customerId,
      recipientRole: 'customer',
      type: 'delivery_update',
      title: 'Meal delivery update',
      message: `${mealName} is now ${statusLabelMap[status]}.`,
      actionUrl: '/dashboard',
      metadata: { orderId, mealName, status },
      priority: status === 'delivered' ? 'critical' : 'normal',
      dedupeKey: `delivery-update:${customerId}:${orderId}:${status}`,
    });
  });
};

const scheduleCustomerReminders = async () => {
  const now = new Date();
  const tomorrow = addDays(now, 1);
  const tomorrowKey = formatDate(tomorrow);
  const cutoffAt = getCutoffForDate(tomorrowKey);

  if (now.getTime() > cutoffAt.getTime()) return;

  const reminderAt = toScheduledTime(cutoffAt, 18, 0);
  const deadlineAlertAt = toScheduledTime(cutoffAt, 19, 30);
  const subscriptions = await getActiveSubscriptions();

  for (const subscription of subscriptions) {
    const meals = (await getDailyMealsBySubscriptionId(subscription.id)).filter(
      (meal) => meal.date === tomorrowKey && !meal.isSkipped
    );

    if (meals.length === 0) continue;

    await queueNotification({
      recipientId: subscription.userId,
      recipientRole: 'customer',
      type: 'meal_reminder',
      title: 'Tomorrow’s meals are lined up',
      message: `${pluralize(meals.length, 'meal')} scheduled for ${tomorrowKey}. Review skips or swaps before 8:00 PM.`,
      actionUrl: '/dashboard',
      metadata: { date: tomorrowKey, totalMeals: meals.length },
      priority: 'normal',
      scheduledFor: sanitizeSchedule(reminderAt, now),
      dedupeKey: `meal-reminder:${subscription.userId}:${tomorrowKey}`,
    });

    await queueNotification({
      recipientId: subscription.userId,
      recipientRole: 'customer',
      type: 'skip_swap_deadline',
      title: 'Skip or swap window closes soon',
      message: `Make final changes for ${tomorrowKey} deliveries before 8:00 PM.`,
      actionUrl: '/dashboard',
      metadata: { date: tomorrowKey, cutoffAt: cutoffAt.toISOString() },
      priority: 'critical',
      scheduledFor: sanitizeSchedule(deadlineAlertAt, now),
      dedupeKey: `skip-swap-deadline:${subscription.userId}:${tomorrowKey}`,
    });
  }
};

const scheduleChefSummaries = async () => {
  const now = new Date();
  const tomorrow = addDays(now, 1);
  const tomorrowKey = formatDate(tomorrow);
  const cutoffAt = getCutoffForDate(tomorrowKey);
  const summaryAt = new Date(cutoffAt);
  summaryAt.setMinutes(summaryAt.getMinutes() + 5);

  const orders = await getOrdersByDate(tomorrowKey);
  const counts = new Map<number, number>();

  for (const order of orders) {
    if (!order.chefId || order.status === 'pending') continue;
    counts.set(order.chefId, (counts.get(order.chefId) || 0) + 1);
  }

  for (const [chefId, totalMeals] of counts.entries()) {
    await queueNotification({
      recipientId: chefId,
      recipientRole: 'chef',
      type: 'daily_meal_count',
      title: 'Tomorrow’s meal count is ready',
      message: `You have ${pluralize(totalMeals, 'meal')} confirmed for ${tomorrowKey}.`,
      actionUrl: '/dashboard',
      metadata: { date: tomorrowKey, totalMeals },
      priority: 'normal',
      scheduledFor: sanitizeSchedule(summaryAt, now),
      dedupeKey: `daily-meal-count:${chefId}:${tomorrowKey}`,
    });
  }
};

const scheduleOperationalNotifications = async () => {
  await scheduleCustomerReminders();
  await scheduleChefSummaries();
};

const resetStaleProcessingNotifications = async (pool: Pool) => {
  await pool.query(
    `
      UPDATE notifications
      SET status = 'queued',
          processing_started_at = NULL,
          updated_at = NOW(),
          error_message = COALESCE(error_message, 'Retrying after stale processing lock')
      WHERE status = 'processing'
        AND processing_started_at IS NOT NULL
        AND processing_started_at < NOW() - ($1 * INTERVAL '1 millisecond')
    `,
    [STALE_PROCESSING_MS]
  );
};

const claimDueNotifications = async (pool: Pool): Promise<QueuedNotificationRow[]> => {
  const result = await pool.query<QueuedNotificationRow>(
    `
      WITH claimed AS (
        SELECT id
        FROM notifications
        WHERE status = 'queued'
          AND scheduled_for <= NOW()
        ORDER BY
          CASE WHEN priority = 'critical' THEN 0 ELSE 1 END,
          scheduled_for ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE notifications AS n
      SET status = 'processing',
          processing_started_at = NOW(),
          last_attempt_at = NOW(),
          attempts = n.attempts + 1,
          updated_at = NOW()
      FROM claimed
      WHERE n.id = claimed.id
      RETURNING n.id, n.status, n.channel, n.attempts, n.max_attempts
    `,
    [PROCESS_BATCH_SIZE]
  );

  return result.rows;
};

const markDelivered = async (pool: Pool, notificationId: number) => {
  await pool.query(
    `
      UPDATE notifications
      SET status = 'delivered',
          delivered_at = NOW(),
          processing_started_at = NULL,
          updated_at = NOW()
      WHERE id = $1
    `,
    [notificationId]
  );
};

const markFailedOrRetry = async (
  pool: Pool,
  notificationId: number,
  attempts: number,
  maxAttempts: number,
  error: unknown
) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown notification processing error';

  if (attempts >= maxAttempts) {
    await pool.query(
      `
        UPDATE notifications
        SET status = 'failed',
            error_message = $2,
            processing_started_at = NULL,
            updated_at = NOW()
        WHERE id = $1
      `,
      [notificationId, errorMessage]
    );
    return;
  }

  const nextAttemptAt = new Date(Date.now() + RETRY_BASE_DELAY_MS * Math.max(1, attempts));

  await pool.query(
    `
      UPDATE notifications
      SET status = 'queued',
          scheduled_for = $2,
          error_message = $3,
          processing_started_at = NULL,
          updated_at = NOW()
      WHERE id = $1
    `,
    [notificationId, nextAttemptAt, errorMessage]
  );
};

const processNotificationQueue = async () => {
  const pool = getPool();

  await resetStaleProcessingNotifications(pool);
  const claimed = await claimDueNotifications(pool);

  for (const notification of claimed) {
    try {
      if (notification.channel !== 'in_app') {
        throw new Error(`Unsupported notification channel: ${notification.channel}`);
      }

      await markDelivered(pool, notification.id);
    } catch (error) {
      await markFailedOrRetry(pool, notification.id, notification.attempts, notification.max_attempts, error);
    }
  }
};

export const startNotificationWorker = () => {
  if (workerStarted) return;
  workerStarted = true;

  void processNotificationQueue().catch((error) => {
    console.error('Notification queue bootstrap failed:', error);
  });

  void scheduleOperationalNotifications().catch((error) => {
    console.error('Notification scheduler bootstrap failed:', error);
  });

  processTimer = setInterval(() => {
    void processNotificationQueue().catch((error) => {
      console.error('Notification queue processing failed:', error);
    });
  }, PROCESS_INTERVAL_MS);

  schedulerTimer = setInterval(() => {
    void scheduleOperationalNotifications().catch((error) => {
      console.error('Notification scheduler failed:', error);
    });
  }, SCHEDULER_INTERVAL_MS);
};

export const stopNotificationWorker = () => {
  if (processTimer) clearInterval(processTimer);
  if (schedulerTimer) clearInterval(schedulerTimer);
  processTimer = null;
  schedulerTimer = null;
  workerStarted = false;
};
