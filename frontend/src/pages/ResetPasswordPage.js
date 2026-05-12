import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const { resetPassword } = useAuth();

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus({ type: 'error', message: 'Brak tokenu resetującego w adresie URL.' });
        }
    }, [token]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear any previous error when typing
        if (status.type === 'error') {
            setStatus({ type: '', message: '' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        if (!token) {
            setStatus({ type: 'error', message: 'Brak tokenu resetującego w adresie URL.' });
            return;
        }

        if (formData.password.length < 8) {
            setStatus({ type: 'error', message: 'Hasło musi mieć minimum 8 znaków.' });
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setStatus({ type: 'error', message: 'Hasła nie są identyczne.' });
            return;
        }

        setLoading(true);

        const result = await resetPassword(token, formData.password);

        if (result.success) {
            setStatus({ type: 'success', message: result.message });
            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } else {
            setStatus({ type: 'error', message: result.error });
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Navigation */}
            <nav className="border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <Link to="/" className="flex items-center">
                            <span className="text-xl font-display font-semibold text-gray-950">AgentHub</span>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Reset Password Form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="max-w-md w-full">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-display font-semibold text-gray-950 mb-3">
                            Ustaw nowe hasło
                        </h1>
                        <p className="text-gray-600">
                            Wprowadź swoje nowe hasło poniżej.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-950 mb-2">
                                Nowe hasło
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all text-gray-950"
                                placeholder="Minimum 8 znaków"
                            />
                        </div>

                        {/* Confirm Password Input */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-950 mb-2">
                                Potwierdź nowe hasło
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all text-gray-950"
                                placeholder="Powtórz hasło"
                            />
                        </div>

                        {/* Status Messages */}
                        {status.message && (
                            <div className={`border rounded-lg p-3 ${status.type === 'error'
                                    ? 'bg-red-50 border-red-200 text-red-600'
                                    : 'bg-green-50 border-green-200 text-green-700'
                                }`}>
                                <p className="text-sm">{status.message}</p>
                                {status.type === 'success' && (
                                    <p className="text-xs mt-1">Przekierowanie do logowania...</p>
                                )}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !token || status.type === 'success'}
                            className="w-full bg-gray-950 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                        >
                            {loading ? 'Zapisywanie...' : 'Zmień hasło'}
                        </button>
                    </form>

                    {/* Back to Login Link */}
                    <p className="text-center mt-8 text-gray-600 text-sm">
                        <Link to="/login" className="text-gray-950 font-semibold hover:underline">
                            Wróć do logowania
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
