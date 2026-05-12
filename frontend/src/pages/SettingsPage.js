import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import Sidebar from '../components/Sidebar';

// ——————————————————————————————
// Toast helper
// ——————————————————————————————
const Toast = ({ toast }) => {
    if (!toast) return null;
    return (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${toast.type === 'success' ? 'bg-gray-950 text-white' : 'bg-red-600 text-white'
            }`}>
            {toast.message}
        </div>
    );
};

// ——————————————————————————————
// Main SettingsPage
// ——————————————————————————————
const SettingsPage = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Profile form
    const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', company: '' });
    const [profileSaving, setProfileSaving] = useState(false);

    // Password form
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    const [passwordSaving, setPasswordSaving] = useState(false);

    // Delete account
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get('/settings/profile');
                setProfile(res.data);
                setProfileForm({
                    firstName: res.data.firstName || '',
                    lastName: res.data.lastName || '',
                    company: res.data.company || '',
                });
            } catch {
                showToast('Nie udało się załadować danych profilu', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // — Profile update —
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileSaving(true);
        try {
            await axios.patch('/settings/profile', profileForm);
            showToast('Profil zaktualizowany pomyślnie');
        } catch (err) {
            showToast(err.response?.data?.error || 'Błąd podczas aktualizacji', 'error');
        } finally {
            setProfileSaving(false);
        }
    };

    // — Password change —
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordSaving(true);
        try {
            await axios.post('/settings/change-password', passwordForm);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            showToast('Hasło zmienione pomyślnie');
        } catch (err) {
            showToast(err.response?.data?.error || 'Błąd podczas zmiany hasła', 'error');
        } finally {
            setPasswordSaving(false);
        }
    };

    // — Delete account —
    const handleDeleteAccount = async () => {
        if (deleteConfirm !== 'USUŃ KONTO') {
            showToast('Wpisz dokładnie "USUŃ KONTO" aby potwierdzić', 'error');
            return;
        }
        setDeleting(true);
        try {
            await axios.delete('/settings/account', { data: { password: deletePassword } });
            logout();
            navigate('/login');
        } catch (err) {
            showToast(err.response?.data?.error || 'Błąd podczas usuwania konta', 'error');
            setDeleting(false);
        }
    };

    // — Stripe Billing —
    const handleUpgradeToPro = async () => {
        try {
            const res = await axios.post('/payments/create-checkout-session');
            window.location.href = res.data.url;
        } catch (err) {
            showToast(err.response?.data?.error || 'Nie udało się rozpocząć płatności', 'error');
        }
    };

    const handleManageSubscription = async () => {
        try {
            const res = await axios.post('/payments/create-portal-session');
            window.location.href = res.data.url;
        } catch (err) {
            showToast(err.response?.data?.error || 'Nie udało się otworzyć portalu', 'error');
        }
    };

    const planBadgeClass = profile?.plan === 'pro'
        ? 'bg-gray-950 text-white'
        : 'bg-gray-100 text-gray-950 border border-gray-200';

    const usagePercent = profile?.messageUsage && !profile.messageUsage.unlimited
        ? Math.round((profile.messageUsage.used / profile.messageUsage.limit) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-white flex">
            <Sidebar activePath="/settings" />

            <main className="flex-1 overflow-auto bg-gray-50">
                <div className="max-w-2xl mx-auto px-8 py-10 space-y-8">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-950">Ustawienia</h2>
                        <p className="text-sm text-gray-500 mt-1">Zarządzaj swoim kontem i preferencjami</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin w-8 h-8 border-2 border-gray-950 border-t-transparent rounded-full" />
                        </div>
                    ) : (
                        <>
                            {/* ── Plan & Użycie ────────────────────────────── */}
                            <section className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="text-base font-semibold text-gray-950 mb-4">Plan i Użycie</h3>
                                <div className="flex items-center gap-3 mb-5">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${planBadgeClass}`}>
                                        {profile?.plan?.toUpperCase()}
                                    </span>
                                    {profile?.plan === 'free' ? (
                                        <span className="text-sm text-gray-500">Ulepsz do PRO (149 PLN/mc) i ciesz się nielimitowanymi wiadomościami</span>
                                    ) : (
                                        <span className="text-sm text-gray-500">Odnawia się automatycznie co miesiąc (149 PLN + nadwyżki)</span>
                                    )}
                                </div>

                                {profile?.messageUsage && !profile.messageUsage.unlimited ? (
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                                            <span>Wiadomości w tym miesiącu</span>
                                            <span className="font-medium text-gray-700">
                                                {profile.messageUsage.used} / {profile.messageUsage.limit}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${usagePercent >= 90 ? 'bg-red-500' : 'bg-gray-950'}`}
                                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1.5">
                                            Reset: {new Date(profile.messageUsage.resetDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                ) : profile?.plan === 'pro' && profile?.messageUsage ? (
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                                            <span>Wykorzystanie z darmowej puli (1000 wiadomości)</span>
                                            <span className="font-medium text-gray-700">
                                                {profile.messageUsage.used || 0} / 1000
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${profile.messageUsage.used >= 900 ? 'bg-amber-500' : 'bg-gray-950'}`}
                                                style={{ width: `${Math.min((profile.messageUsage.used / 1000) * 100, 100)}%` }}
                                            />
                                        </div>
                                        {profile.messageUsage.used > 1000 && (
                                            <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                Przekroczono limit: {(profile.messageUsage.used - 1000)} wiadomości płatne po 0.08 PLN
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full inline-block"></span>
                                        Darmowy limit: 50 wiadomości miesięcznie
                                    </p>
                                )}

                                {profile?.plan === 'free' ? (
                                    <button
                                        onClick={handleUpgradeToPro}
                                        className="mt-6 px-4 py-2.5 bg-gray-950 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                        Ulepsz do PRO (149 PLN/mc + 1000 zapytań)
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleManageSubscription}
                                        className="mt-6 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Zarządzaj subskrypcją
                                    </button>
                                )}
                            </section>

                            {/* ── Profil ────────────────────────────────────── */}
                            <section className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="text-base font-semibold text-gray-950 mb-4">Dane profilowe</h3>
                                <form onSubmit={handleProfileSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Imię</label>
                                            <input
                                                type="text"
                                                value={profileForm.firstName}
                                                onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Nazwisko</label>
                                            <input
                                                type="text"
                                                value={profileForm.lastName}
                                                onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
                                        <input
                                            type="email"
                                            value={profile?.email || ''}
                                            disabled
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Adres email nie może być zmieniony</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Firma <span className="text-gray-400">(opcjonalnie)</span></label>
                                        <input
                                            type="text"
                                            value={profileForm.company}
                                            onChange={e => setProfileForm(f => ({ ...f, company: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all"
                                            placeholder="Nazwa firmy"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={profileSaving}
                                            className="px-5 py-2.5 bg-gray-950 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                                        >
                                            {profileSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}
                                        </button>
                                    </div>
                                </form>
                            </section>

                            {/* ── Zmiana hasła ──────────────────────────────── */}
                            <section className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="text-base font-semibold text-gray-950 mb-4">Zmiana hasła</h3>
                                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Aktualne hasło</label>
                                        <input
                                            type="password"
                                            value={passwordForm.currentPassword}
                                            onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Nowe hasło</label>
                                        <input
                                            type="password"
                                            value={passwordForm.newPassword}
                                            onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all"
                                            minLength={8}
                                            required
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Minimum 8 znaków</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Potwierdź nowe hasło</label>
                                        <input
                                            type="password"
                                            value={passwordForm.confirmNewPassword}
                                            onChange={e => setPasswordForm(f => ({ ...f, confirmNewPassword: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={passwordSaving}
                                            className="px-5 py-2.5 bg-gray-950 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                                        >
                                            {passwordSaving ? 'Zmienianie...' : 'Zmień hasło'}
                                        </button>
                                    </div>
                                </form>
                            </section>

                            {/* ── Danger Zone ───────────────────────────────── */}
                            <section className="bg-white rounded-xl border border-red-200 p-6">
                                <h3 className="text-base font-semibold text-red-600 mb-1">Strefa niebezpieczna</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Usunięcie konta jest nieodwracalne. Wszystkie Twoje agenty, dokumenty i rozmowy zostaną trwale usunięte.
                                </p>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="px-4 py-2.5 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    Usuń konto
                                </button>
                            </section>
                        </>
                    )}
                </div>
            </main>

            {/* ── Delete Modal ──────────────────────────────── */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
                        <h4 className="text-lg font-semibold text-gray-950 mb-1">Usuń konto</h4>
                        <p className="text-sm text-gray-500 mb-5">
                            Ta operacja jest <strong>nieodwracalna</strong>. Potwierdź swoim hasłem i wpisz <code className="bg-gray-100 px-1 rounded text-xs">USUŃ KONTO</code>.
                        </p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Hasło</label>
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={e => setDeletePassword(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-10 transition-all"
                                    placeholder="Twoje aktualne hasło"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Wpisz: USUŃ KONTO</label>
                                <input
                                    type="text"
                                    value={deleteConfirm}
                                    onChange={e => setDeleteConfirm(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-10 transition-all"
                                    placeholder="USUŃ KONTO"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteConfirm(''); }}
                                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Anuluj
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleting || deleteConfirm !== 'USUŃ KONTO' || !deletePassword}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-40"
                            >
                                {deleting ? 'Usuwanie...' : 'Usuń konto'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Toast toast={toast} />
        </div>
    );
};

export default SettingsPage;
