const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async ({ email, userId, customerId }) => {
    const sessionConfig = {
        payment_method_types: ['card'],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL}/settings?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/settings`,
        ...(customerId ? { customer: customerId } : { customer_email: email }),
        client_reference_id: userId,
        line_items: [
            {
                price: process.env.STRIPE_PRO_PRICE_ID,
                quantity: 1,
            },
            ...(process.env.STRIPE_UASGE_PRICE_ID
                ? [{ price: process.env.STRIPE_UASGE_PRICE_ID }]
                : []
            ),
        ],
        metadata: {
            userId,
        }
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return session;
};

const createPortalSession = async ({ customerId }) => {
    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.FRONTEND_URL}/settings`,
    });
    return session;
};

const reportUsage = async (customerId) => {
    if (!customerId) return;
    try {
        await stripe.billing.meterEvents.create({
            event_name: 'agenthub_message',
            payload: {
                value: '1',
                stripe_customer_id: customerId,
            },
        });
    } catch (error) {
        console.error('Failed to report usage to Stripe for customer:', customerId, error);
    }
}

module.exports = {
    stripe,
    createCheckoutSession,
    createPortalSession,
    reportUsage,
};
