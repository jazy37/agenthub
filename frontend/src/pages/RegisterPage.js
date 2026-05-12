import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const result = await register(formData);

    if (result.success) {
      setSuccess('Konto utworzone! Sprawdź swoją skrzynkę email, aby zweryfikować konto.');
      setLoading(false);
      // Don't navigate, wait for email verification
    } else {
      setError(result.error);
      setLoading(false);
    }
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
            <div className="flex items-center gap-8">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-950 font-medium transition-colors text-sm"
              >
                Masz już konto?
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Register Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-display font-semibold text-gray-950 mb-3">
              Rozpocznij za darmo
            </h1>
            <p className="text-gray-600">
              Stwórz konto i uruchom pierwszego agenta w 5 minut
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First Name and Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-950 mb-2">
                  Imię
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all text-gray-950"
                  placeholder="Jan"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-950 mb-2">
                  Nazwisko
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all text-gray-950"
                  placeholder="Kowalski"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-950 mb-2">
                Adres email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all text-gray-950"
                placeholder="jan.kowalski@example.com"
              />
            </div>

            {/* Company Input */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-950 mb-2">
                Firma (jeśli dotyczy)
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all text-gray-950"
                placeholder="Nazwa firmy"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-950 mb-2">
                Hasło
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all text-gray-950"
                placeholder="Minimum 8 znaków"
              />
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-950 mb-2">
                Powtórz hasło
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                minLength={8}
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all text-gray-950"
                placeholder="Powtórz hasło"
              />
            </div>

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-500 rounded-lg p-3">
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-500 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-950 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Tworzenie konta...' : 'Utwórz konto'}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center mt-8 text-gray-600 text-sm">
            Masz już konto?{' '}
            <Link to="/login" className="text-gray-950 font-semibold hover:underline">
              Zaloguj się
            </Link>
          </p>

          {/* Terms */}
          <p className="text-center mt-6 text-xs text-gray-500">
            Rejestrując się akceptujesz nasze{' '}
            <a href="#" className="underline hover:text-gray-950">Warunki użytkowania</a>
            {' '}i{' '}
            <a href="#" className="underline hover:text-gray-950">Politykę prywatności</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
