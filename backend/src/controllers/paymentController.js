const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { stripe, createCheckoutSession, createPortalSession } = require('../services/stripe.service');

const createCheckout = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const session = await createCheckoutSession({
            email: user.email,
            userId: user.id,
            customerId: user.stripeCustomerId,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
};

const createPortal = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user || !user.stripeCustomerId) {
            return res.status(400).json({ error: 'No active subscription found' });
        }

        const session = await createPortalSession({
            customerId: user.stripeCustomerId,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating portal session:', error);
        res.status(500).json({ error: 'Failed to create portal session' });
    }
};

const webhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.client_reference_id || session.metadata?.userId;
                const customerId = session.customer;
                const subscriptionId = session.subscription;

                if (userId) {
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            stripeCustomerId: customerId,
                            stripeSubscriptionId: subscriptionId,
                            plan: 'pro',
                        },
                    });
                    console.log(`✅ User ${userId} upgraded to Pro plan`);
                }
                break;
            }

            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const customerId = subscription.customer;
                const status = subscription.status;

                const plan = status === 'active' || status === 'trialing' ? 'pro' : 'free';

                await prisma.user.updateMany({
                    where: { stripeCustomerId: customerId },
                    data: {
                        stripeSubscriptionId: subscription.id,
                        plan: plan,
                        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    },
                });

                console.log(`🔄 Subscription for customer ${customerId} updated to status ${status}`);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                const customerId = invoice.customer;

                await prisma.user.updateMany({
                    where: { stripeCustomerId: customerId },
                    data: {
                        plan: 'free',
                    }
                });

                console.log(`❌ Invoice failed for customer ${customerId}. Downgraded to Free plan.`);
                break;
            }

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

module.exports = {
    createCheckout,
    createPortal,
    webhook,
};
