const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { getMessageUsage } = require('../utils/messageLimit');

const prisma = new PrismaClient();

// GET /api/settings/profile  – zwraca profil użytkownika + użycie
const getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                company: true,
                plan: true,
                createdAt: true,
                verified: true,
            },
        });

        if (!user) return res.status(404).json({ error: 'Użytkownik nie znaleziony' });

        const messageUsage = await getMessageUsage(req.userId);

        res.json({ ...user, messageUsage });
    } catch (error) {
        console.error('getProfile error:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

// PATCH /api/settings/profile  – aktualizacja imienia, nazwiska, firmy
const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, company } = req.body;

        if (!firstName?.trim() || !lastName?.trim()) {
            return res.status(400).json({ error: 'Imię i nazwisko są wymagane' });
        }

        const user = await prisma.user.update({
            where: { id: req.userId },
            data: {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                company: company?.trim() || null,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                company: true,
                plan: true,
            },
        });

        res.json(user);
    } catch (error) {
        console.error('updateProfile error:', error);
        res.status(500).json({ error: 'Błąd podczas aktualizacji profilu' });
    }
};

// POST /api/settings/change-password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmNewPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({ error: 'Wszystkie pola są wymagane' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Nowe hasło musi mieć minimum 8 znaków' });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ error: 'Nowe hasła nie są identyczne' });
        }

        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user) return res.status(404).json({ error: 'Użytkownik nie znaleziony' });

        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Aktualne hasło jest nieprawidłowe' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: req.userId },
            data: { passwordHash },
        });

        res.json({ message: 'Hasło zostało zmienione pomyślnie' });
    } catch (error) {
        console.error('changePassword error:', error);
        res.status(500).json({ error: 'Błąd podczas zmiany hasła' });
    }
};

// DELETE /api/settings/account  – usuwa konto i wszystkie dane
const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Podaj hasło aby potwierdzić usunięcie konta' });
        }

        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user) return res.status(404).json({ error: 'Użytkownik nie znaleziony' });

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Nieprawidłowe hasło' });
        }

        // Cascade delete: agents, documents, conversations, messages, llmConfigs
        await prisma.user.delete({ where: { id: req.userId } });

        res.json({ message: 'Konto zostało trwale usunięte' });
    } catch (error) {
        console.error('deleteAccount error:', error);
        res.status(500).json({ error: 'Błąd podczas usuwania konta' });
    }
};

module.exports = { getProfile, updateProfile, changePassword, deleteAccount };
