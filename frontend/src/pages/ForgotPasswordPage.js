import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ForgotPasswordPage = () => {
    const { forgotPassword } = useAuth();

    const [email, setEmail] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });
        setLoading(true);

        const result = await forgotPassword(email);

        if (result.success) {
            setStatus({ type: 'success', message: result.message });
            setEmail('');
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

            {/* Forgot Password Form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="max-w-md w-full">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-display font-semibold text-gray-950 mb-3">
                            Resetowanie hasła
                        </h1>
                        <p className="text-gray-600">
                            Podaj swój adres email, a prześlemy Ci link do zresetowania hasła.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-950 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all text-gray-950"
                                placeholder="twoj@email.com"
                            />
                        </div>

                        {/* Status Messages */}
                        {status.message && (
                            <div className={`border rounded-lg p-3 ${status.type === 'error'
                                    ? 'bg-red-50 border-red-200 text-red-600'
                                    : 'bg-green-50 border-green-200 text-green-700'
                                }`}>
                                <p className="text-sm">{status.message}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-950 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                        >
                            {loading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
                        </button>
                    </form>

                    {/* Back to Login Link */}
                    <p className="text-center mt-8 text-gray-600 text-sm">
                        Pamiętasz hasło?{' '}
                        <Link to="/login" className="text-gray-950 font-semibold hover:underline">
                            Zaloguj się
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
