import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Inteligentny RAG',
      description: 'Bot uczy się z Twoich dokumentów i odpowiada kontekstowo',
    },
    {
      title: 'Multi-Channel',
      description: 'Jeden agent dla WebChat, WhatsApp i Messenger',
    },
    {
      title: 'Bez Kodu',
      description: 'Gotowy do pracy w 5 minut. Zero programowania',
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <span className="text-xl font-display font-semibold text-gray-950">AgentHub</span>
            </div>
            <div className="flex items-center gap-8">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-gray-950 font-medium transition-colors text-sm"
              >
                Zaloguj się
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-gray-950 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-all duration-200 text-sm font-medium"
              >
                Rozpocznij
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 lg:px-8 overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-primary opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-accent opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-primary opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <h1 className="text-6xl md:text-7xl font-display font-semibold text-gray-950 mb-8 leading-tight tracking-tight animate-fade-in-up">
            AI Agent w 5 minut
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
            Stwórz inteligentnego chatbota z własną bazą wiedzy.
            Bez kodu, bez komplikacji.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-400">
            <button
              onClick={() => navigate('/register')}
              className="bg-gray-950 text-white px-8 py-4 rounded-lg text-base font-medium hover:bg-gray-800 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Zacznij za darmo
            </button>
            <button className="border border-gray-300 text-gray-950 px-8 py-4 rounded-lg text-base font-medium hover:bg-gray-50 hover:scale-105 transition-all duration-200">
              Zobacz demo
            </button>
          </div>

          {/* Animated Chatbot Preview */}
          <div className="mt-20 animate-fade-in-up animation-delay-600">
            <div className="relative mx-auto max-w-4xl">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-3xl opacity-30"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Browser Header */}
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 ml-4">
                    <div className="bg-white rounded px-3 py-1 text-xs text-gray-500 max-w-xs">
                      yourwebsite.com/best-chat
                    </div>
                  </div>
                </div>

                {/* Chat Interface */}
                <div className="bg-gradient-to-b from-gray-50 to-white p-8 min-h-[400px]">
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-white font-semibold">
                      AI
                    </div>
                    <div>
                      <div className="font-semibold text-gray-950">Support Agent</div>
                      <div className="text-xs text-success flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-success"></div>
                        Online
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="space-y-4">
                    {/* User Message 1 */}
                    <div className="flex justify-end chat-message-1">
                      <div className="bg-gray-950 text-white px-4 py-3 rounded-2xl rounded-tr-sm max-w-xs">
                        <p className="text-sm">Jak mogę zintegrować bota z moją stroną?</p>
                      </div>
                    </div>

                    {/* Bot Message 1 */}
                    <div className="flex justify-start chat-message-2">
                      <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm max-w-md shadow-sm">
                        <p className="text-sm text-gray-950 mb-2">Integracja jest bardzo prosta! Wystarczy:</p>
                        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                          <li>Skopiować kod embed</li>
                          <li>Wkleić przed zamknięciem {'</body>'}</li>
                          <li>Gotowe! 🎉</li>
                        </ol>
                      </div>
                    </div>

                    {/* User Message 2 */}
                    <div className="flex justify-end chat-message-3">
                      <div className="bg-gray-950 text-white px-4 py-3 rounded-2xl rounded-tr-sm max-w-xs">
                        <p className="text-sm">Świetnie! A jak z WhatsApp?</p>
                      </div>
                    </div>

                    {/* Bot Typing Indicator */}
                    <div className="flex justify-start chat-message-4">
                      <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-200"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-400"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-16">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <h3 className="text-xl font-display font-semibold text-gray-950 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-24 px-6 lg:px-8 border-b border-gray-200">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm text-gray-500 uppercase tracking-wider mb-8">Zaufały nam</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-40">
            <div className="text-2xl font-bold text-gray-950">Startup A</div>
            <div className="text-2xl font-bold text-gray-950">Firma B</div>
            <div className="text-2xl font-bold text-gray-950">Company C</div>
            <div className="text-2xl font-bold text-gray-950">Brand D</div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-display font-semibold text-gray-950 mb-4">
              Proste ceny
            </h2>
            <p className="text-xl text-gray-600">
              Rozpocznij za darmo. Skaluj kiedy potrzebujesz.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* FREE Plan */}
            <div className="border border-gray-200 rounded-2xl p-10 hover:border-gray-300 transition-all duration-200">
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">
                  Free
                </h3>
                <div className="flex items-baseline mb-2">
                  <span className="text-5xl font-display font-semibold text-gray-950">0 zł</span>
                  <span className="text-gray-500 ml-2">/miesiąc</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10">
                <li className="flex items-start text-gray-600">
                  <svg className="w-5 h-5 text-gray-950 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  1 agent
                </li>
                <li className="flex items-start text-gray-600">
                  <svg className="w-5 h-5 text-gray-950 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  100 wiadomości/miesiąc
                </li>
                <li className="flex items-start text-gray-600">
                  <svg className="w-5 h-5 text-gray-950 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Tylko WebChat
                </li>
                <li className="flex items-start text-gray-600">
                  <svg className="w-5 h-5 text-gray-950 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Podstawowa analityka
                </li>
              </ul>

              <button
                onClick={() => navigate('/register')}
                className="w-full border border-gray-300 text-gray-950 py-3 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
              >
                Rozpocznij
              </button>
            </div>

            {/* PRO Plan */}
            <div className="border-2 border-gray-950 rounded-2xl p-10 bg-gray-950 text-white relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white text-xs font-semibold px-4 py-1.5 rounded-full">
                  Popularne
                </span>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Pro
                </h3>
                <div className="flex items-baseline mb-2">
                  <span className="text-5xl font-display font-semibold">149 zł</span>
                  <span className="text-gray-400 ml-2">/miesiąc</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10">
                <li className="flex items-start text-gray-200">
                  <svg className="w-5 h-5 text-white mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  5 agentów
                </li>
                <li className="flex items-start text-gray-200">
                  <svg className="w-5 h-5 text-white mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Nielimitowane wiadomości
                </li>
                <li className="flex items-start text-gray-200">
                  <svg className="w-5 h-5 text-white mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Wszystkie kanały
                </li>
                <li className="flex items-start text-gray-200">
                  <svg className="w-5 h-5 text-white mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Zaawansowana analityka
                </li>
                <li className="flex items-start text-gray-200">
                  <svg className="w-5 h-5 text-white mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Wsparcie priorytetowe
                </li>
              </ul>

              <button
                onClick={() => navigate('/register')}
                className="w-full bg-white text-gray-950 py-3 rounded-lg font-medium hover:bg-gray-100 transition-all duration-200"
              >
                Wybierz PRO
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8 bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-display font-semibold mb-6">
            Gotowy na start?
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Dołącz do firm automatyzujących obsługę klienta
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-gray-950 px-8 py-4 rounded-lg text-base font-medium hover:bg-gray-100 transition-all duration-200"
          >
            Zacznij za darmo
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-lg font-display font-semibold text-gray-950">AgentHub</span>
            </div>
            <div className="text-sm text-gray-500">
              © 2025 AgentHub. Wszystkie prawa zastrzeżone. Created by Jakub Kulesza.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
