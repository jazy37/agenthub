import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
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
    setLoading(true);

    const result = await register(formData.email, formData.password);

    if (result.success) {
      navigate('/dashboard');
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
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all text-gray-950"
                placeholder="twoj@email.com"
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
              <p className="text-xs text-gray-500 mt-2">Użyj minimum 8 znaków</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-error rounded-lg p-3">
                <p className="text-error text-sm">{error}</p>
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
