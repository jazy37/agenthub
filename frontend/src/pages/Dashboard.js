import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import AgentCard from '../components/AgentCard';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const handleRestore = async (agentId) => {
    try {
      await axios.post(`/agents/${agentId}/restore`);
      // Refresh the agents list after successful restore
      fetchAgents();
    } catch (error) {
      console.error('Error restoring agent:', error);
      alert(error.response?.data?.error || 'Błąd podczas przywracania agenta');
    }
  };


  const agentLimit = user?.plan === 'pro' ? 5 : 1;
  const canCreateMore = agents.length < agentLimit;

  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar activePath="/dashboard" />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-4">
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

            {/* Message Usage Stats */}
            {user?.messageUsage && user.messageUsage.plan === 'free' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-950">
                      Limit wiadomości (plan FREE)
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Wykorzystano: {user.messageUsage.used} / {user.messageUsage.limit} wiadomości
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-950">
                      {user.messageUsage.remaining}
                    </p>
                    <p className="text-xs text-gray-600">pozostało</p>
                  </div>
                </div>
                {user.messageUsage.remaining === 0 ? (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-red-600 font-medium">
                      ⚠️ Osiągnąłeś miesięczny limit wiadomości na planie FREE. Poczekaj do następnego miesiąca lub przejdź na plan PRO. Twój widget nie będzie działać, dopóki limit nie zostanie zresetowany.
                    </p>
                  </div>
                ) : user.messageUsage.remaining <= 10 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-orange-600 font-medium">
                      ⚠️ Zbliżasz się do limitu! Przejdź na plan PRO, aby uzyskać nielimitowane wiadomości.
                    </p>
                  </div>
                )}
              </div>
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
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onRestore={handleRestore}
                  />
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
