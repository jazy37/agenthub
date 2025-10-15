import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../utils/axios';
import Modal from '../components/Modal';
import KnowledgeBase from '../components/KnowledgeBase';
import ChatInterface from '../components/ChatInterface';

const AgentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'settings' | 'knowledge' | 'test'
  const [llmConfigs, setLlmConfigs] = useState([]);

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    llmConfigId: '',
    llmModel: '',
    brandColor: '#2563EB',
    welcomeMessage: '',
    status: 'active'
  });

  useEffect(() => {
    fetchAgent();
    fetchLLMConfigs();
  }, [id]);

  const fetchLLMConfigs = async () => {
    try {
      const response = await axios.get('/llm');
      setLlmConfigs(response.data);
    } catch (error) {
      console.error('Error fetching LLM configs:', error);
    }
  };

  const fetchAgent = async () => {
    try {
      const response = await axios.get(`/agents/${id}`);
      setAgent(response.data);
      setFormData({
        name: response.data.name,
        description: response.data.description || '',
        llmConfigId: response.data.llmConfigId || '',
        llmModel: response.data.llmModel,
        brandColor: response.data.brandColor,
        welcomeMessage: response.data.welcomeMessage,
        status: response.data.status
      });
    } catch (err) {
      setError('Nie znaleziono agenta');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Prepare data - don't send llmModel, backend will handle it based on llmConfigId
      const submitData = {
        name: formData.name,
        description: formData.description,
        llmConfigId: formData.llmConfigId || null,
        brandColor: formData.brandColor,
        welcomeMessage: formData.welcomeMessage,
        status: formData.status
      };

      const response = await axios.put(`/agents/${id}`, submitData);
      setAgent(response.data);
      setShowSuccessModal(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas zapisywania');
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/dashboard');
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/agents/${id}`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas usuwania');
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-950 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-display font-semibold text-gray-950 mb-2">Agent nie znaleziony</h2>
          <Link to="/dashboard" className="text-gray-600 hover:text-gray-950">
            ← Powrót do Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-6">
          <Link to="/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-950 transition-colors mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Powrót
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-display font-semibold text-gray-950 mb-2">
                {agent.name}
              </h1>
              {agent.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {agent.description}
                </p>
              )}
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    agent.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {agent.status === 'active' ? '🟢 Aktywny' : '⚫ Nieaktywny'}
                </span>
                <span className="text-sm text-gray-500">
                  Utworzono: {new Date(agent.createdAt).toLocaleDateString('pl-PL')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-gray-950 text-gray-950'
                  : 'border-transparent text-gray-600 hover:text-gray-950'
              }`}
            >
              Przegląd
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'settings'
                  ? 'border-gray-950 text-gray-950'
                  : 'border-transparent text-gray-600 hover:text-gray-950'
              }`}
            >
              Ustawienia
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'knowledge'
                  ? 'border-gray-950 text-gray-950'
                  : 'border-transparent text-gray-600 hover:text-gray-950'
              }`}
            >
              Baza Wiedzy
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'test'
                  ? 'border-gray-950 text-gray-950'
                  : 'border-transparent text-gray-600 hover:text-gray-950'
              }`}
            >
              Testuj agenta
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        {activeTab === 'test' ? (
          /* Test Agent Tab */
          <div>
            <h2 className="text-xl font-display font-semibold text-gray-950 mb-6">Testuj Agenta</h2>
            <div className="max-w-4xl">
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <ChatInterface agentId={id} agent={agent} />
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Ta wiadomość zostanie zapisana w historii konwersacji. Możesz używać tego chatu do testowania zachowania agenta przed wdrożeniem.
              </p>
            </div>
          </div>
        ) : activeTab === 'knowledge' ? (
          /* Knowledge Base Tab */
          <KnowledgeBase agentId={id} />
        ) : activeTab === 'overview' ? (
          /* Overview Tab */
          <div>
            <h2 className="text-xl font-display font-semibold text-gray-950 mb-6">Statystyki</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm text-gray-600 mb-2">Rozmowy</h3>
                <p className="text-4xl font-display font-semibold text-gray-950">{agent._count?.conversations || 0}</p>
                <p className="text-xs text-gray-500 mt-2">Produkcyjne</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm text-gray-600 mb-2">Dokumenty</h3>
                <p className="text-4xl font-display font-semibold text-gray-950">{agent._count?.documents || 0}</p>
                <p className="text-xs text-gray-500 mt-2">W bazie wiedzy</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm text-gray-600 mb-2">Wiadomości dzisiaj</h3>
                <p className="text-4xl font-display font-semibold text-gray-950">0</p>
                <p className="text-xs text-gray-500 mt-2">Ostatnie 24h</p>
              </div>
            </div>

            <div className="mt-8 border border-gray-200 rounded-xl p-8 text-center">
              <p className="text-gray-600">
                Statystyki będą dostępne po pierwszych rozmowach z agentem
              </p>
            </div>
          </div>
        ) : (
          /* Settings Tab */
          <div>
            <h2 className="text-xl font-display font-semibold text-gray-950 mb-6">Konfiguracja Agenta</h2>

            <form onSubmit={handleSave} className="max-w-2xl space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-950 mb-2">
                  Nazwa agenta *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all text-gray-950"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-950 mb-2">
                  Opis (opcjonalnie)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all text-gray-950 resize-none"
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-950 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all text-gray-950"
                >
                  <option value="active">Aktywny</option>
                  <option value="inactive">Nieaktywny</option>
                </select>
              </div>

              {/* LLM Configuration */}
              <div>
                <label htmlFor="llmConfigId" className="block text-sm font-medium text-gray-950 mb-2">
                  Konfiguracja LLM
                </label>
                <select
                  id="llmConfigId"
                  name="llmConfigId"
                  value={formData.llmConfigId}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all text-gray-950"
                >
                  <option value="">Domyślny LLM (AgentHub)</option>
                  {llmConfigs.map((config) => (
                    <option key={config.id} value={config.id}>
                      {config.name} ({config.provider} - {config.model})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  {llmConfigs.length === 0 ? (
                    <>Brak własnych konfiguracji. Dodaj swoją w zakładce <Link to="/llm" className="text-blue-600 hover:underline">LLM</Link></>
                  ) : (
                    'Wybierz własny LLM lub użyj domyślnego'
                  )}
                </p>
              </div>

              {/* Brand Color */}
              <div>
                <label htmlFor="brandColor" className="block text-sm font-medium text-gray-950 mb-2">
                  Kolor marki
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    id="brandColor"
                    name="brandColor"
                    value={formData.brandColor}
                    onChange={handleChange}
                    className="h-12 w-20 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.brandColor}
                    onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all text-gray-950 font-mono text-sm"
                  />
                </div>
              </div>

              {/* Welcome Message */}
              <div>
                <label htmlFor="welcomeMessage" className="block text-sm font-medium text-gray-950 mb-2">
                  Wiadomość powitalna
                </label>
                <input
                  type="text"
                  id="welcomeMessage"
                  name="welcomeMessage"
                  value={formData.welcomeMessage}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all text-gray-950"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-error rounded-lg p-4">
                  <p className="text-error text-sm">{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gray-950 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Zapisywanie...' : 'Zapisz Zmiany'}
                </button>
              </div>
            </form>

            {/* Widget Embed Section */}
            <div className="mt-12 pt-8 border-t border-gray-200 max-w-2xl">
              <h3 className="text-lg font-display font-semibold text-gray-950 mb-2">Widget Chat</h3>
              <p className="text-sm text-gray-600 mb-4">
                Skopiuj poniższy kod i wklej go przed zamykającym tagiem <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> na swojej stronie.
              </p>
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <pre className="whitespace-pre-wrap break-all text-gray-800">
{`<script>
  (function() {
    window.AgentHubConfig = {
      agentId: "${agent.id}",
      serverUrl: "http://localhost:5000"
    };
    var script = document.createElement('script');
    script.src = 'http://localhost:5000/widget.js';
    script.async = true;
    document.body.appendChild(script);
  })();
</script>`}
                </pre>
              </div>
              <button
                onClick={() => {
                  const embedCode = `<script>\n  (function() {\n    window.AgentHubConfig = {\n      agentId: "${agent.id}",\n      serverUrl: "http://localhost:5000"\n    };\n    var script = document.createElement('script');\n    script.src = 'http://localhost:5000/widget.js';\n    script.async = true;\n    document.body.appendChild(script);\n  })();\n</script>`;
                  navigator.clipboard.writeText(embedCode);
                  setCodeCopied(true);
                  setTimeout(() => setCodeCopied(false), 2000);
                }}
                className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  codeCopied
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-950 text-white hover:bg-gray-800'
                }`}
              >
                {codeCopied ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Skopiowano!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Kopiuj kod
                  </>
                )}
              </button>
            </div>

            {/* Delete Section */}
            <div className="mt-12 pt-8 border-t border-gray-200 max-w-2xl">
              <h3 className="text-lg font-display font-semibold text-gray-950 mb-2">Strefa niebezpieczna</h3>
              <p className="text-sm text-gray-600 mb-4">
                Usunięcie agenta jest nieodwracalne. Wszystkie dane zostaną trwale usunięte.
              </p>
              <button
                onClick={handleDeleteClick}
                className="border-2 border-error text-error px-6 py-3 rounded-lg font-medium hover:bg-red-50 transition-all duration-200"
              >
                Usuń Agenta
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Zmiany zapisane"
        message="Ustawienia agenta zostały pomyślnie zaktualizowane."
        type="success"
        confirmText="OK"
      />

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Usuń agenta"
        message="Czy na pewno chcesz usunąć tego agenta? Ta operacja jest nieodwracalna i wszystkie dane zostaną trwale usunięte."
        type="warning"
        confirmText="Usuń"
        cancelText="Anuluj"
      />
    </div>
  );
};

export default AgentDetails;
