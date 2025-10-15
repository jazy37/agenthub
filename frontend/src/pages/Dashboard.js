import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import AgentCard from '../components/AgentCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await axios.get('/agents');
      setAgents(response.data);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const agentLimit = user?.plan === 'pro' ? 5 : 1;
  const canCreateMore = agents.length < agentLimit;

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-display font-semibold text-gray-950">AgentHub</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <button className="w-full text-left px-4 py-2.5 rounded-lg bg-gray-100 text-gray-950 font-medium text-sm">
                Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/agents/new')}
                className="w-full text-left px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors text-sm"
              >
                Nowy Agent
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/llm')}
                className="w-full text-left px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors text-sm"
              >
                LLM
              </button>
            </li>
            <li>
              <button className="w-full text-left px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors text-sm">
                Analityka
              </button>
            </li>
            <li>
              <button className="w-full text-left px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors text-sm">
                Ustawienia
              </button>
            </li>
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200">
          <div className="mb-3 px-2">
            <p className="text-xs text-gray-500 mb-1">Zalogowany jako</p>
            <p className="text-sm font-medium text-gray-950 truncate">{user?.email}</p>
            <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
              user?.plan === 'pro'
                ? 'bg-gray-950 text-white'
                : 'bg-gray-200 text-gray-950'
            }`}>
              {user?.plan?.toUpperCase()}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors text-sm text-left"
          >
            Wyloguj się
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="px-8 py-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-semibold text-gray-950">
                Twoi Agenci
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {agents.length} / {agentLimit} {agentLimit === 1 ? 'agent' : 'agentów'}
              </p>
            </div>
            {canCreateMore && (
              <button
                onClick={() => navigate('/agents/new')}
                className="bg-gray-950 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-all duration-200"
              >
                + Nowy Agent
              </button>
            )}
          </div>
        </header>

        <div className="p-8">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-950 mx-auto"></div>
              <p className="text-gray-600 mt-4">Ładowanie...</p>
            </div>
          ) : agents.length === 0 ? (
            /* Empty State */
            <div className="border border-gray-200 rounded-xl p-16">
              <div className="text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-display font-semibold text-gray-950 mb-2">
                  Brak agentów
                </h3>
                <p className="text-gray-600 mb-6">
                  Stwórz pierwszego AI agenta i zacznij automatyzować obsługę klienta
                </p>
                <button
                  onClick={() => navigate('/agents/new')}
                  className="bg-gray-950 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-all duration-200"
                >
                  Utwórz pierwszego agenta
                </button>
              </div>
            </div>
          ) : (
            /* Agents Grid */
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {agents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>

              {!canCreateMore && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-600">
                    Osiągnąłeś limit agentów dla planu {user?.plan?.toUpperCase()}.
                    {user?.plan === 'free' && (
                      <span className="font-semibold"> Przejdź na plan PRO, aby dodać więcej agentów!</span>
                    )}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Quick Start Guide - tylko jeśli są agenci */}
          {agents.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-display font-semibold text-gray-950 mb-4">
                Następne kroki
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-lg">📚</span>
                  </div>
                  <h4 className="font-medium text-gray-950 mb-1 text-sm">Dodaj bazę wiedzy</h4>
                  <p className="text-xs text-gray-600">Wgraj dokumenty lub dodaj FAQ</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-lg">🎨</span>
                  </div>
                  <h4 className="font-medium text-gray-950 mb-1 text-sm">Personalizuj wygląd</h4>
                  <p className="text-xs text-gray-600">Dostosuj kolory i wiadomości</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-lg">🚀</span>
                  </div>
                  <h4 className="font-medium text-gray-950 mb-1 text-sm">Wdróż na stronie</h4>
                  <p className="text-xs text-gray-600">Skopiuj kod i wklej na swoją stronę</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
