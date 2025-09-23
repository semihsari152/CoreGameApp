import React, { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';
import { ReportType } from '../../services/reportService';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reportType: ReportType, reason: string, description?: string) => Promise<void>;
  isLoading?: boolean;
  targetName?: string;
}

const REPORT_OPTIONS = [
  { type: ReportType.Spam, label: 'Spam veya İstenmeyen İçerik', description: 'Tekrarlayan veya istenmeyen mesajlar' },
  { type: ReportType.Harassment, label: 'Taciz veya Zorbalık', description: 'Hakaret, tehdit veya rahatsız edici davranış' },
  { type: ReportType.InappropriateContent, label: 'Uygunsuz İçerik', description: 'Müstehcen, şiddet içeren veya zararlı içerik' },
  { type: ReportType.FakeProfile, label: 'Sahte Profil', description: 'Kimlik hırsızlığı veya yanıltıcı profil' },
  { type: ReportType.OffensiveLanguage, label: 'Saldırgan Dil', description: 'Küfür, nefret söylemi veya ayrımcı dil' },
  { type: ReportType.Other, label: 'Diğer', description: 'Yukarıdaki kategorilere girmeyen sorunlar' }
];

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  targetName = 'Bu kullanıcı'
}) => {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !reason.trim()) return;

    await onSubmit(selectedType, reason.trim(), description.trim() || undefined);
    handleClose();
  };

  const handleClose = () => {
    setSelectedType(null);
    setReason('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Flag className="w-6 h-6 text-red-500" />
            Şikayet Et
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                  {targetName} hakkında şikayette bulunuyorsunuz
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  Şikayetiniz incelendikten sonra gerekli işlemler yapılacaktır.
                </p>
              </div>
            </div>

            {/* Report Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Şikayet Nedeni *
              </label>
              <select
                value={selectedType || ''}
                onChange={(e) => setSelectedType(parseInt(e.target.value) as ReportType)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
                disabled={isLoading}
              >
                <option value="">Bir neden seçin...</option>
                {REPORT_OPTIONS.map((option) => (
                  <option key={option.type} value={option.type}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kısa Açıklama *
              </label>
              <input
                type="text"
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Şikayetinizi kısaca açıklayın..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                maxLength={100}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {reason.length}/100 karakter
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Detaylı Açıklama (İsteğe bağlı)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Şikayetiniz hakkında daha fazla bilgi verebilirsiniz..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                maxLength={500}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {description.length}/500 karakter
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              disabled={isLoading}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!selectedType || !reason.trim() || isLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4" />
                  Şikayet Gönder
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;