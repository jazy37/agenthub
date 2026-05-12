import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import CustomSelect from '../components/CustomSelect';
import Sidebar from '../components/Sidebar';

const AgentCreate = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [llmConfigs, setLlmConfigs] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    llmConfigId: '',
    llmModel: '',
    brandColor: '#2563EB',
    welcomeMessage: 'Cześć! W czym mogę pomóc?'
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
    }
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
    setLoading(true);

    try {
      // Prepare data - only send llmConfigId if selected, remove llmModel
      const submitData = {
        name: formData.name,
        description: formData.description,
        brandColor: formData.brandColor,
        welcomeMessage: formData.welcomeMessage
      };

      // Only add llmConfigId if user selected custom LLM
      if (formData.llmConfigId) {
        submitData.llmConfigId = formData.llmConfigId;
      }

      const response = await axios.post('/agents', submitData);
      navigate(`/agents/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas tworzenia agenta');
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar activePath="/agents/new" />

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-2xl w-full">
          <div className="mb-10">
            <h1 className="text-4xl font-display font-semibold text-gray-950 mb-3">
              Stwórz Nowego Agenta
            </h1>
            <p className="text-gray-600">
              Wypełnij podstawowe informacje o swoim AI agencie
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="np. Support Bot, FAQ Assistant"
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
                placeholder="Krótki opis przeznaczenia agenta..."
              />
            </div>

            {/* LLM Configuration */}
            <div>
              <label htmlFor="llmConfigId" className="block text-sm font-medium text-gray-950 mb-2">
                Konfiguracja LLM
              </label>
              <CustomSelect
                name="llmConfigId"
                value={formData.llmConfigId}
                onChange={handleChange}
                options={[
                  { value: '', label: 'Domyślny LLM (AgentHub)' },
                  ...llmConfigs.map((config) => ({
                    value: config.id,
                    label: `${config.name} (${config.provider} - ${config.model})`
                  }))
                ]}
              />
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
                  placeholder="#2563EB"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Kolor będzie używany w widgecie chatu i interfejsie agenta
              </p>
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
                placeholder="Cześć! W czym mogę pomóc?"
              />
              <p className="text-xs text-gray-500 mt-2">
                Pierwsza wiadomość wyświetlana użytkownikom
              </p>
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
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 border border-gray-300 text-gray-950 py-3 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gray-950 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Tworzenie...' : 'Utwórz Agenta'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AgentCreate;
