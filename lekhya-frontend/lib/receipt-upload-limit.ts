export const DAILY_RECEIPT_UPLOAD_LIMIT = 10;

export function getTodayReceiptWindow(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export async function getTodayReceiptUploadStats(
  prisma: {
    receipt: {
      count: (args: {
        where: {
          userId: string;
          createdAt: { gte: Date; lt: Date };
        };
      }) => Promise<number>;
    };
  },
  userId: string
) {
  const { start, end } = getTodayReceiptWindow();

  const uploadedToday = await prisma.receipt.count({
    where: {
      userId,
      createdAt: {
        gte: start,
        lt: end,
      },
    },
  });

  return {
    uploadedToday,
    remainingToday: Math.max(0, DAILY_RECEIPT_UPLOAD_LIMIT - uploadedToday),
    limit: DAILY_RECEIPT_UPLOAD_LIMIT,
    windowStart: start,
    windowEnd: end,
  };
}
