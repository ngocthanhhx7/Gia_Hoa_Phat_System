import { createNotifications } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const SUPPORT_STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"] as const;

export function canManageSupport(role?: string) {
  return ["ADMIN", "STAFF"].includes(role || "");
}

export async function notifySupportUpdate({
  ticketId,
  subject,
  recipientIds,
  senderId,
  message,
}: {
  ticketId: string;
  subject: string;
  recipientIds: string[];
  senderId?: string | null;
  message: string;
}) {
  if (recipientIds.length === 0) return;

  await createNotifications(
    recipientIds.map((recipientId) => ({
      type: "SUPPORT_UPDATED",
      title: `Ticket hỗ trợ #${ticketId.slice(0, 8)}`,
      message: `${subject}: ${message}`,
      recipientId,
      senderId: senderId || undefined,
      channel: "IN_APP" as const,
    }))
  );
}

export async function getSupportStaffIds(excludeId?: string) {
  const users = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "STAFF"] },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  return users.map((user) => user.id);
}
