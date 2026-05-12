import React from 'react';
import { useNavigate } from 'react-router-dom';

const AgentCard = ({ agent, onRestore }) => {
  const navigate = useNavigate();

  return (
    <div className={`border rounded-xl p-6 transition-all duration-200 group ${agent.deletedAt
        ? 'border-red-200 bg-red-50/30'
        : 'border-gray-200 hover:border-gray-300'
      }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-display font-semibold text-gray-950 mb-1 group-hover:text-gray-700 transition-colors">
            {agent.name}
          </h3>
          {agent.description && (
            <p className="text-sm text-gray-600">
              {(() => {
                const words = agent.description.trim().split(/\s+/);
                const preview = words.slice(0, 5).join(' ');
                return words.length > 5 ? preview + '...' : preview;
              })()}
            </p>
          )}
        </div>
        <span
          className={`ml-4 px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${agent.deletedAt
              ? 'bg-red-100 text-red-700'
              : agent.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
        >
          {agent.deletedAt ? 'Usunięty' : agent.status === 'active' ? 'Aktywny' : 'Nieaktywny'}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
        <div>
          <span className="font-medium">{agent._count?.conversations || 0}</span> rozmów
        </div>
        <div>
          <span className="font-medium">{agent._count?.documents || 0}</span> dokumentów
        </div>
      </div>

      {/* Model info */}
      <div className="flex items-center gap-2 mb-4">
        <div className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-700">
          {agent.llmModel}
        </div>
        <div
          className="w-4 h-4 rounded-full border border-gray-300"
          style={{ backgroundColor: agent.brandColor }}
          title={`Kolor marki: ${agent.brandColor}`}
        />
      </div>

      {/* Action button */}
      {agent.deletedAt ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onRestore) onRestore(agent.id);
          }}
          className="w-full bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-all duration-200"
        >
          Przywróć agenta
        </button>
      ) : (
        <button
          onClick={() => navigate(`/agents/${agent.id}`)}
          className="w-full bg-gray-950 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all duration-200"
        >
          Zarządzaj
        </button>
      )}
    </div>
  );
};

export default AgentCard;
