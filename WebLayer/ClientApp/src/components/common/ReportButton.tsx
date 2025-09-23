import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@tanstack/react-query';
import { Flag, X, AlertTriangle } from 'lucide-react';
import { ReportableType, ReportType, CreateReportDto } from '../../types';
import { reportsAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface ReportButtonProps {
  entityType: ReportableType;
  entityId: number;
  entityTitle?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'icon' | 'menu';
  className?: string;
}

interface ReportFormData {
  reportType: ReportType;
  reason: string;
  description: string;
}

const ReportButton: React.FC<ReportButtonProps> = ({
  entityType,
  entityId,
  entityTitle,
  size = 'md',
  variant = 'button',
  className = ''
}) => {
  const { isAuthenticated } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ReportFormData>({
    reportType: ReportType.Other,
    reason: '',
    description: ''
  });

  // Submit report mutation
  const submitReportMutation = useMutation({
    mutationFn: (data: CreateReportDto) => reportsAPI.create(data),
    onSuccess: () => {
      toast.success('Raporunuz başarıyla gönderildi');
      setIsModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Rapor gönderilirken bir hata oluştu');
    }
  });

  const resetForm = () => {
    setFormData({
      reportType: ReportType.Other,
      reason: '',
      description: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Bu işlem için giriş yapmalısınız');
      return;
    }

    if (!formData.reason.trim()) {
      toast.error('Lütfen bir sebep belirtiniz');
      return;
    }

    submitReportMutation.mutate({
      reportableType: entityType,
      reportableEntityId: entityId,
      reportType: formData.reportType,
      reason: formData.reason.trim(),
      description: formData.description.trim() || undefined
    });
  };

  const handleOpenModal = () => {
    if (!isAuthenticated) {
      toast.error('Bu işlem için giriş yapmalısınız');
      return;
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const paddingClasses = {
    sm: 'px-2 py-1',
    md: 'px-3 py-1.5',
    lg: 'px-4 py-2'
  };

  // Get report type display names
  const getReportTypeName = (type: ReportType): string => {
    const names: Record<ReportType, string> = {
      [ReportType.Spam]: 'Spam',
      [ReportType.InappropriateContent]: 'Uygunsuz İçerik',
      [ReportType.Harassment]: 'Taciz/Zorbalık',
      [ReportType.CopyrightViolation]: 'Telif Hakkı İhlali',
      [ReportType.Misinformation]: 'Yanlış Bilgi',
      [ReportType.FakeProfile]: 'Sahte Profil',
      [ReportType.OffensiveLanguage]: 'Saldırgan Dil',
      [ReportType.Other]: 'Diğer'
    };
    return names[type] || 'Diğer';
  };

  // Get entity type display name
  const getEntityTypeName = (type: ReportableType): string => {
    const names: Record<ReportableType, string> = {
      [ReportableType.Comment]: 'yorumu',
      [ReportableType.Guide]: 'kılavuzu',
      [ReportableType.BlogPost]: 'blog yazısını',
      [ReportableType.ForumTopic]: 'forum konusunu',
      [ReportableType.User]: 'kullanıcıyı'
    };
    return names[type] || 'içeriği';
  };

  // Render button based on variant
  const renderButton = () => {
    if (variant === 'icon') {
      return (
        <button
          onClick={handleOpenModal}
          className={`inline-flex items-center justify-center transition-colors ${
            paddingClasses[size]
          } ${sizeClasses[size]} text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg ${className}`}
          title="Raporla"
        >
          <Flag className={iconSizeClasses[size]} />
        </button>
      );
    }

    if (variant === 'menu') {
      return (
        <button
          onClick={handleOpenModal}
          className={`w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${className}`}
        >
          <Flag className="w-4 h-4" />
          Raporla
        </button>
      );
    }

    // Default button variant
    return (
      <button
        onClick={handleOpenModal}
        className={`inline-flex items-center gap-2 transition-colors ${
          paddingClasses[size]
        } ${sizeClasses[size]} text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg ${className}`}
      >
        <Flag className={iconSizeClasses[size]} />
        <span>Raporla</span>
      </button>
    );
  };

  return (
    <>
      {renderButton()}

      {/* Report Modal - Using Portal to render at body level */}
      {isModalOpen && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[99999] p-4" 
          style={{paddingTop: '20px'}}
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  İçerik Raporla
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Bu {getEntityTypeName(entityType)} rapor etmek istiyorsunuz
                  {entityTitle && (
                    <span className="font-medium text-gray-900 dark:text-white">: {entityTitle}</span>
                  )}
                </p>
              </div>

              {/* Report Type */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rapor Türü *
                </label>
                <select
                  value={formData.reportType}
                  onChange={(e) => setFormData(prev => ({ ...prev, reportType: parseInt(e.target.value) as ReportType }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {Object.values(ReportType)
                    .filter((value): value is ReportType => typeof value === 'number')
                    .map((type) => (
                    <option key={type} value={type}>
                      {getReportTypeName(type)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sebep *
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Kısa bir açıklama yazın..."
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  required
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {formData.reason.length}/100 karakter
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Detaylı Açıklama (İsteğe Bağlı)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Daha detaylı açıklama ekleyebilirsiniz..."
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {formData.description.length}/500 karakter
                </p>
              </div>

              {/* Warning */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-800 dark:text-blue-300">
                    <p className="font-medium mb-0.5">Dikkat:</p>
                    <p>Yanlış raporlar hesabınıza kısıtlama getirebilir. Lütfen sadece gerçek ihlalleri bildirin.</p>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitReportMutation.isLoading || !formData.reason.trim()}
                  className="flex-1 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md transition-colors flex items-center justify-center gap-1"
                >
                  {submitReportMutation.isLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Flag className="w-3 h-3" />
                      Gönder
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ReportButton;