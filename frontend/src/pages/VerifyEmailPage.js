import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from '../utils/axios';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const hasVerified = useRef(false);

  useEffect(() => {
    // Prevent double verification in React strict mode
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Brak tokenu weryfikacyjnego.');
        return;
      }

      try {
        const response = await axios.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(response.data.message);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Błąd podczas weryfikacji konta.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

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

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center">
          {status === 'verifying' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-950 mx-auto mb-6"></div>
              <h1 className="text-2xl font-display font-semibold text-gray-950 mb-3">
                Weryfikacja konta...
              </h1>
              <p className="text-gray-600">
                Proszę czekać, weryfikujemy Twoje konto.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-display font-semibold text-gray-950 mb-3">
                Konto zweryfikowane!
              </h1>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Za chwilę zostaniesz przekierowany do strony logowania...
              </p>
              <Link
                to="/login"
                className="inline-block bg-gray-950 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-all duration-200"
              >
                Przejdź do logowania
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-display font-semibold text-gray-950 mb-3">
                Błąd weryfikacji
              </h1>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <Link
                  to="/register"
                  className="block w-full bg-gray-950 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-all duration-200"
                >
                  Zarejestruj się ponownie
                </Link>
                <Link
                  to="/login"
                  className="block w-full border border-gray-300 text-gray-950 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
                >
                  Wróć do logowania
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
