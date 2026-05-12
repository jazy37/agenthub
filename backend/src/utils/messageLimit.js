const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { reportUsage } = require('../services/stripe.service');

const FREE_PLAN_MESSAGE_LIMIT = 50;

/**
 * Check if user needs message count reset (monthly)
 */
async function checkAndResetMessageCount(user) {
  const now = new Date();
  const resetDate = new Date(user.messageCountResetDate);

  // Check if a month has passed since last reset
  const monthsPassed = (now.getFullYear() - resetDate.getFullYear()) * 12 +
    (now.getMonth() - resetDate.getMonth());

  if (monthsPassed >= 1) {
    // Reset counter
    await prisma.user.update({
      where: { id: user.id },
      data: {
        messagesThisMonth: 0,
        messageCountResetDate: now,
      },
    });
    return { ...user, messagesThisMonth: 0, messageCountResetDate: now };
  }

  return user;
}

/**
 * Check if user can send a message (for free plan users)
 */
async function canSendMessage(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Pro users have unlimited messages
  if (user.plan === 'pro') {
    return { allowed: true, user };
  }

  // Check and reset if needed
  const updatedUser = await checkAndResetMessageCount(user);

  // Check if free user is under limit
  if (updatedUser.messagesThisMonth >= FREE_PLAN_MESSAGE_LIMIT) {
    return {
      allowed: false,
      user: updatedUser,
      limit: FREE_PLAN_MESSAGE_LIMIT,
      used: updatedUser.messagesThisMonth,
    };
  }

  return { allowed: true, user: updatedUser };
}

/**
 * Increment message count for user
 */
async function incrementMessageCount(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, stripeCustomerId: true }
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      messagesThisMonth: {
        increment: 1,
      },
    },
  });

  if (user && user.plan === 'pro' && user.stripeCustomerId) {
    await reportUsage(user.stripeCustomerId);
  }
}

/**
 * Get message usage stats for user
 */
async function getMessageUsage(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check and reset if needed
  const updatedUser = await checkAndResetMessageCount(user);

  if (updatedUser.plan === 'pro') {
    return {
      plan: 'pro',
      unlimited: true,
    };
  }

  return {
    plan: 'free',
    used: updatedUser.messagesThisMonth,
    limit: FREE_PLAN_MESSAGE_LIMIT,
    remaining: FREE_PLAN_MESSAGE_LIMIT - updatedUser.messagesThisMonth,
    resetDate: updatedUser.messageCountResetDate,
  };
}

module.exports = {
  canSendMessage,
  incrementMessageCount,
  getMessageUsage,
  FREE_PLAN_MESSAGE_LIMIT,
};
