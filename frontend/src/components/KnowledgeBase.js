import React, { useState, useEffect, useCallback } from 'react';
import axios from '../utils/axios';
import Modal from './Modal';

const KnowledgeBase = ({ agentId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [agentId]);

  // Auto-refresh for processing documents
  useEffect(() => {
    const hasProcessingDocs = documents.some(doc => !doc.processed && !doc.error);

    if (hasProcessingDocs) {
      const interval = setInterval(() => {
        fetchDocuments();
      }, 3000); // Refresh every 3 seconds

      return () => clearInterval(interval);
    }
  }, [documents, agentId]);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`/documents/agent/${agentId}`);
      setDocuments(response.data);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Błąd podczas pobierania dokumentów');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = e.dataTransfer?.files;
      if (files && files[0]) {
        await uploadFile(files[0]);
      }
    },
    [agentId]
  );

  const handleFileInput = async (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file) => {
    // Validate file type
    const allowedTypes = ['.pdf', '.txt', '.docx', '.doc'];
    const fileName = file.name.toLowerCase();
    const isValid = allowedTypes.some((type) => fileName.endsWith(type));

    if (!isValid) {
      setError('Nieprawidłowy typ pliku. Dozwolone: PDF, TXT, DOCX');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Plik jest za duży. Maksymalny rozmiar: 10MB');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('agentId', agentId);

    try {
      await axios.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas przesyłania pliku');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      window.open(doc.downloadUrl, '_blank');
    } catch (err) {
      setError('Błąd podczas pobierania pliku');
    }
  };

  const handleDeleteClick = (doc) => {
    setSelectedDocument(doc);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDocument) return;

    try {
      await axios.delete(`/documents/${selectedDocument.id}`);
      await fetchDocuments();
      setShowDeleteModal(false);
      setSelectedDocument(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas usuwania dokumentu');
      setShowDeleteModal(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'docx':
      case 'doc':
        return '📝';
      case 'txt':
        return '📃';
      default:
        return '📄';
    }
  };

  const getStatusBadge = (doc) => {
    if (doc.error) {
      return (
        <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
          Błąd
        </span>
      );
    }
    if (!doc.processed) {
      return (
        <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-full">
          Przetwarzanie...
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
        Gotowy
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-950 mx-auto mb-4"></div>
        <p className="text-gray-600">Ładowanie...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-display font-semibold text-gray-950 mb-6">
        Baza Wiedzy
      </h2>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive
            ? 'border-gray-950 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          {uploading ? 'Przesyłanie...' : 'Przeciągnij plik tutaj lub kliknij, aby wybrać'}
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Obsługiwane formaty: PDF, DOCX, TXT (max 10MB)
        </p>
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.txt,.docx,.doc"
          onChange={handleFileInput}
          disabled={uploading}
        />
        <label
          htmlFor="file-upload"
          className="inline-block bg-gray-950 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors cursor-pointer"
        >
          Wybierz Plik
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Documents List */}
      {documents.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-950 mb-4">
            Przesłane dokumenty ({documents.length})
          </h3>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{getFileIcon(doc.fileType)}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-950 truncate">
                        {doc.filename}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{doc.chunksCount} chunków</span>
                        <span>•</span>
                        <span>
                          {new Date(doc.uploadedAt).toLocaleDateString('pl-PL')}
                        </span>
                      </div>
                      {doc.error && (
                        <p className="text-xs text-red-600 mt-1">{doc.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {getStatusBadge(doc)}
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 text-gray-600 hover:text-gray-950 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Pobierz"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(doc)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Usuń"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-600">
            Brak dokumentów w bazie wiedzy. Dodaj pierwszy dokument powyżej.
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Usuń dokument"
        message={`Czy na pewno chcesz usunąć dokument "${selectedDocument?.filename}"? Ta operacja jest nieodwracalna.`}
        type="warning"
        confirmText="Usuń"
        cancelText="Anuluj"
      />
    </div>
  );
};

export default KnowledgeBase;
