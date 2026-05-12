import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Nowy Agent', path: '/agents/new' },
    { label: 'LLM', path: '/llm' },
    { label: 'Analityka', path: '/analytics' },
    { label: 'Ustawienia', path: '/settings' },
];

/**
 * Shared sidebar component used across all dashboard pages.
 *
 * @param {string} activePath - current route path to highlight active item
 */
const Sidebar = ({ activePath }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="w-64 h-screen sticky top-0 bg-white border-r border-gray-200 flex flex-col shrink-0">
            {/* Logo */}
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-xl font-display font-semibold text-gray-950">AgentHub</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <ul className="space-y-1">
                    {NAV_ITEMS.map(item => (
                        <li key={item.path}>
                            <button
                                onClick={() => navigate(item.path)}
                                className={`w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${activePath === item.path
                                    ? 'bg-gray-100 text-gray-950'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {item.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* User Info & Logout */}
            <div className="p-4 border-t border-gray-200">
                <div className="mb-3 px-2">
                    <p className="text-xs text-gray-500 mb-1">Zalogowany jako</p>
                    <p className="text-sm font-medium text-gray-950 truncate">{user?.email}</p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${user?.plan === 'pro' ? 'bg-gray-950 text-white' : 'bg-gray-200 text-gray-950'
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
    );
};

export default Sidebar;
