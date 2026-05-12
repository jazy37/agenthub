import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import axios from '../utils/axios';
import CustomSelect from '../components/CustomSelect';
import Modal from '../components/Modal';

const LLMPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [llmConfigs, setLlmConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    provider: 'openai',
    model: '',
    apiKey: '',
    baseUrl: ''
  });

  useEffect(() => {
    fetchLLMConfigs();
  }, []);

  const fetchLLMConfigs = async () => {
    try {
      const response = await axios.get('/llm');
      setLlmConfigs(response.data);
    } catch (error) {
      console.error('Error fetching LLM configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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

    try {
      if (editingId) {
        await axios.put(`/llm/${editingId}`, formData);
      } else {
        await axios.post('/llm', formData);
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: '',
        provider: 'openai',
        model: '',
        apiKey: '',
        baseUrl: ''
      });
      fetchLLMConfigs();
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas zapisywania');
    }
  };

  const handleEdit = (llmConfig) => {
    setEditingId(llmConfig.id);
    setFormData({
      name: llmConfig.name,
      provider: llmConfig.provider,
      model: llmConfig.model,
      apiKey: '',
      baseUrl: llmConfig.baseUrl || ''
    });
    setShowForm(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/llm/${deleteId}`);
      setShowDeleteModal(false);
      setDeleteId(null);
      fetchLLMConfigs();
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas usuwania');
      setShowDeleteModal(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      provider: 'openai',
      model: '',
      apiKey: '',
      baseUrl: ''
    });
    setError('');
  };

  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar activePath="/llm" />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="px-8 py-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-semibold text-gray-950">
                Konfiguracje LLM
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Zarządzaj swoimi modelami językowymi i kluczami API
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gray-950 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-all duration-200"
            >
              + Dodaj LLM
            </button>
          </div>
        </header>

        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-error rounded-lg p-4">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          {showForm ? (
            <div className="max-w-2xl">
              <h3 className="text-lg font-display font-semibold text-gray-950 mb-6">
                {editingId ? 'Edytuj konfigurację LLM' : 'Nowa konfiguracja LLM'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-950 mb-2">
                    Nazwa *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all text-gray-950"
                    placeholder="np. Mój OpenAI GPT-4"
                  />
                </div>

                <div>
                  <label htmlFor="provider" className="block text-sm font-medium text-gray-950 mb-2">
                    Provider *
                  </label>
                  <CustomSelect
                    name="provider"
                    value={formData.provider}
                    onChange={handleChange}
                    options={[
                      { value: 'openai', label: 'OpenAI' },
                      { value: 'anthropic', label: 'Anthropic' },
                      { value: 'custom', label: 'Custom' }
                    ]}
                  />
                </div>

                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-950 mb-2">
                    Model *
                  </label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    required
                    value={formData.model}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all text-gray-950"
                    placeholder="np. gpt-4, claude-3-opus"
                  />
                </div>

                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium text-gray-950 mb-2">
                    API Key {editingId ? '(zostaw puste aby nie zmieniać)' : '*'}
                  </label>
                  <input
                    type="password"
                    id="apiKey"
                    name="apiKey"
                    required={!editingId}
                    value={formData.apiKey}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all text-gray-950 font-mono text-sm"
                    placeholder="sk-..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Klucz API będzie bezpiecznie zaszyfrowany
                  </p>
                </div>

                <div>
                  <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-950 mb-2">
                    Base URL (opcjonalne)
                  </label>
                  <input
                    type="text"
                    id="baseUrl"
                    name="baseUrl"
                    value={formData.baseUrl}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all text-gray-950"
                    placeholder="https://api.openai.com/v1"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Tylko dla custom providerów
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 border border-gray-300 text-gray-950 py-3 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gray-950 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-all duration-200"
                  >
                    {editingId ? 'Zapisz zmiany' : 'Dodaj LLM'}
                  </button>
                </div>
              </form>
            </div>
          ) : loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-950 mx-auto"></div>
              <p className="text-gray-600 mt-4">Ładowanie...</p>
            </div>
          ) : llmConfigs.length === 0 ? (
            <div className="border border-gray-200 rounded-xl p-16">
              <div className="text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-display font-semibold text-gray-950 mb-2">
                  Brak konfiguracji LLM
                </h3>
                <p className="text-gray-600 mb-6">
                  Dodaj własny klucz API aby korzystać z zaawansowanych modeli językowych
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-gray-950 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-all duration-200"
                >
                  Dodaj pierwszą konfigurację
                </button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {llmConfigs.map((config) => (
                <div key={config.id} className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-display font-semibold text-gray-950 mb-1">
                        {config.name}
                      </h3>
                      <p className="text-sm text-gray-600">{config.provider}</p>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-700">
                      {config.model}
                    </span>
                  </div>

                  <div className="mb-4 text-xs text-gray-500">
                    <p>Używane przez {config._count.agents} agentów</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(config)}
                      className="flex-1 border border-gray-300 text-gray-950 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
                    >
                      Edytuj
                    </button>
                    <button
                      onClick={() => handleDeleteClick(config.id)}
                      className="flex-1 border-2 border-error text-error py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-all"
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Usuń konfigurację LLM"
        message="Czy na pewno chcesz usunąć tę konfigurację? Agenci używający tej konfiguracji zostaną przełączeni na domyślny LLM."
        type="warning"
        confirmText="Usuń"
        cancelText="Anuluj"
      />
    </div>
  );
};

export default LLMPage;
