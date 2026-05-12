import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import CustomSelect from '../components/CustomSelect';
import Sidebar from '../components/Sidebar';

const Analytics = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [agents, setAgents] = useState([]);
    const [selectedAgentId, setSelectedAgentId] = useState('');

    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    useEffect(() => {
        fetchAgents();
    }, []);

    useEffect(() => {
        if (selectedAgentId) {
            fetchConversations(selectedAgentId);
        } else {
            setConversations([]);
            setLoading(false);
        }
    }, [selectedAgentId]);

    const fetchAgents = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/analytics/agents');
            setAgents(response.data);
            if (response.data.length > 0) {
                setSelectedAgentId(response.data[0].id);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching agents:', error);
            setLoading(false);
        }
    };

    const fetchConversations = async (agentId) => {
        try {
            setLoading(true);
            const response = await axios.get(`/analytics/conversations?agentId=${agentId}`);
            setConversations(response.data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenConversation = async (conversation) => {
        setSelectedConversation(conversation);
        setLoadingMessages(true);
        try {
            const response = await axios.get(`/analytics/conversations/${conversation.id}/messages`);
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Format date helper
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pl-PL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="min-h-screen bg-white flex">
            <Sidebar activePath="/analytics" />

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="border-b border-gray-200 bg-white p-6 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-display font-semibold text-gray-950">
                                Historia Konwersacji
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Analizuj rozmowy swoich agentów AI z klientami
                            </p>
                        </div>

                        {/* Agent Selector */}
                        {agents.length > 0 && (
                            <div className="w-64">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Wybierz Agenta</label>
                                <CustomSelect
                                    value={selectedAgentId}
                                    onChange={(e) => setSelectedAgentId(e.target.value)}
                                    className="w-full text-sm"
                                    options={agents.map(agent => ({
                                        value: agent.id,
                                        label: `${agent.name} ${agent.deletedAt ? '(Usunięto)' : ''}`
                                    }))}
                                />
                            </div>
                        )}
                    </div>
                </header>

                {/* Content Area - Split View */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Left Panel: Conversation List */}
                    <div className="w-1/3 border-r border-gray-200 bg-gray-50 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-950"></div>
                            </div>
                        ) : agents.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                Nie masz jeszcze żadnych agentów.
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-500 mb-4">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h3 className="text-sm font-medium text-gray-900">Brak rozmów</h3>
                                <p className="text-sm text-gray-500 mt-1">Ten agent nie przeprowadził jeszcze żadnych rozmów.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {conversations.map((conv) => (
                                    <li
                                        key={conv.id}
                                        onClick={() => handleOpenConversation(conv)}
                                        className={`p-4 hover:bg-gray-100 cursor-pointer transition-colors ${selectedConversation?.id === conv.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                                    >
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="text-xs font-semibold text-gray-500 uppercase">
                                                {conv.channel}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {formatDate(conv.lastMessageAt)}
                                            </span>
                                        </div>
                                        {conv.messages && conv.messages.length > 0 ? (
                                            <p className="text-sm text-gray-900 line-clamp-2">
                                                <span className="font-medium">{conv.messages[0].sender === 'user' ? 'Klient: ' : 'AI: '}</span>
                                                {conv.messages[0].text}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">Brak wiadomości</p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Right Panel: Conversation Details */}
                    <div className="w-2/3 bg-white flex flex-col">
                        {selectedConversation ? (
                            <>
                                {/* Chat Header */}
                                <div className="px-6 py-4 border-b border-gray-200 bg-white shrink-0 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">Szczegóły rozmowy</h3>
                                        <p className="text-xs text-gray-500">
                                            Zaczęto: {formatDate(selectedConversation.startedAt)}
                                        </p>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedConversation.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {selectedConversation.status}
                                    </span>
                                </div>

                                {/* Chat Messages */}
                                <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                                    {loadingMessages ? (
                                        <div className="flex justify-center items-center h-full">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="text-center text-gray-500 mt-10">
                                            Brak wiadomości w ujęciu historycznym.
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {messages.map((msg, idx) => {
                                                const isUser = msg.sender === 'user';
                                                return (
                                                    <div key={msg.id || idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[75%] rounded-2xl px-5 py-3 ${isUser
                                                            ? 'bg-gray-950 text-white rounded-br-none'
                                                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none shadow-sm'
                                                            }`}>
                                                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                                            <span className={`text-[10px] block mt-1 ${isUser ? 'text-gray-400' : 'text-gray-400'}`}>
                                                                {formatDate(msg.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col justify-center items-center p-8 text-gray-500 bg-gray-50">
                                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p>Wybierz konwersację z listy po lewej, aby zobaczyć jej szczegóły.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Analytics;
