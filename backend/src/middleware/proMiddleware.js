const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Middleware to check if user has PRO plan
const requireProPlan = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    if (user.plan !== 'pro') {
      return res.status(403).json({
        error: 'Ta funkcjonalność jest dostępna tylko dla użytkowników planu PRO',
        requiresPro: true
      });
    }

    next();
  } catch (error) {
    console.error('Pro middleware error:', error);
    res.status(500).json({ error: 'Błąd weryfikacji planu' });
  }
};

module.exports = requireProPlan;
