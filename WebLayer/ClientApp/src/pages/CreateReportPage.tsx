import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { 
  Flag, 
  AlertTriangle, 
  User, 
  MessageSquare, 
  FileText, 
  Gamepad2,
  BookOpen,
  PenTool,
  ArrowLeft,
  Send
} from 'lucide-react';
import { reportsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { ReportableType, ReportType, CreateReportDto } from '../types';
import toast from 'react-hot-toast';

interface ReportFormData {
  reportType: ReportType;
  reason: string;
  description?: string;
  evidence?: string;
}

const CreateReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  // Pre-fill form if coming from a specific entity
  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');
  const entityTitle = searchParams.get('entityTitle');

  // Convert entity type string to enum
  const getReportableType = (type: string | null): ReportableType => {
    switch (type) {
      case 'comment': return ReportableType.Comment;
      case 'guide': return ReportableType.Guide;
      case 'blog': return ReportableType.BlogPost;
      case 'forum': return ReportableType.ForumTopic;
      case 'user': return ReportableType.User;
      default: return ReportableType.Comment;
    }
  };

  const reportableType = getReportableType(entityType);
  const reportableEntityId = entityId ? parseInt(entityId) : 0;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<ReportFormData>({
    defaultValues: {
      reportType: ReportType.Other,
      reason: '',
      description: '',
      evidence: ''
    }
  });

  const createReportMutation = useMutation({
    mutationFn: (data: CreateReportDto) => reportsAPI.create(data),
    onSuccess: () => {
      toast.success('Raporunuz başarıyla gönderildi. İnceleyeceğiz.');
      navigate('/');
    },
    onError: () => {
      toast.error('Rapor gönderilirken bir hata oluştu');
    }
  });

  const watchedReportType = watch('reportType');

  const onSubmit = (data: ReportFormData) => {
    if (!isAuthenticated) {
      toast.error('Rapor göndermek için giriş yapmalısınız');
      return;
    }
    
    if (!reportableEntityId) {
      toast.error('Rapor edilecek içerik bulunamadı');
      return;
    }

    const reportData: CreateReportDto = {
      reportableType,
      reportableEntityId,
      reportType: data.reportType,
      reason: data.reason,
      description: data.description,
      evidence: data.evidence
    };

    createReportMutation.mutate(reportData);
  };

  const reportTypes = [
    { value: ReportType.Spam, label: 'Spam', description: 'İstenmeyen veya tekrarlanan içerik' },
    { value: ReportType.InappropriateContent, label: 'Uygunsuz İçerik', description: 'Topluluk kurallarına aykırı içerik' },
    { value: ReportType.Harassment, label: 'Taciz', description: 'Zorbalık veya taciz edici davranış' },
    { value: ReportType.CopyrightViolation, label: 'Telif Hakkı İhlali', description: 'Telif hakkı korumalı içerik' },
    { value: ReportType.Misinformation, label: 'Yanlış Bilgi', description: 'Yanıltıcı veya yanlış bilgi' },
    { value: ReportType.FakeProfile, label: 'Sahte Profil', description: 'Kimlik sahteciliği' },
    { value: ReportType.OffensiveLanguage, label: 'Saldırgan Dil', description: 'Hakaret veya saldırgan ifadeler' },
    { value: ReportType.Other, label: 'Diğer', description: 'Yukarıdaki kategorilere girmeyen diğer sorunlar' },
  ];

  const getEntityTypeLabel = (type: ReportableType): string => {
    switch (type) {
      case ReportableType.Comment: return 'Yorum';
      case ReportableType.Guide: return 'Kılavuz';
      case ReportableType.BlogPost: return 'Blog Yazısı';
      case ReportableType.ForumTopic: return 'Forum Konusu';
      case ReportableType.User: return 'Kullanıcı';
      default: return 'İçerik';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Flag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Giriş Gerekli
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Rapor göndermek için giriş yapmalısınız.
          </p>
        </div>
      </div>
    );
  }

  if (!reportableEntityId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Flag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Geçersiz İstek
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Rapor edilecek içerik bulunamadı.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Rapor Gönder
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Topluluk kurallarına aykırı içerik bildirin
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Entity Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Rapor Edilen İçerik
            </h3>
            <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
              <FileText className="w-5 h-5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {entityTitle || 'Seçilen İçerik'}
                </p>
                <p className="text-sm">Tür: {getEntityTypeLabel(reportableType)}</p>
              </div>
            </div>
          </div>

          {/* Report Type Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Rapor Türü
            </h2>
            <div className="space-y-3">
              {reportTypes.map((type) => (
                <label
                  key={type.value}
                  className={`block p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    watchedReportType === type.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    {...register('reportType', { required: 'Rapor türü seçmeniz gereklidir' })}
                    type="radio"
                    value={type.value}
                    className="sr-only"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {type.label}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {type.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.reportType && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.reportType.message}
              </p>
            )}
          </div>

          {/* Report Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Rapor Detayları
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kısa Açıklama *
                </label>
                <input
                  {...register('reason', {
                    required: 'Kısa açıklama gereklidir',
                    minLength: {
                      value: 5,
                      message: 'Açıklama en az 5 karakter olmalıdır'
                    },
                    maxLength: {
                      value: 200,
                      message: 'Açıklama en fazla 200 karakter olabilir'
                    }
                  })}
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.reason ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="Sorunu kısaca özetleyin..."
                />
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.reason.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Detaylı Açıklama
                </label>
                <textarea
                  {...register('description', {
                    maxLength: {
                      value: 1000,
                      message: 'Açıklama en fazla 1000 karakter olabilir'
                    }
                  })}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                    errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="Durumu detaylı bir şekilde açıklayın (isteğe bağlı)..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kanıt/Ek Bilgi
                </label>
                <textarea
                  {...register('evidence')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Varsa ek kanıt veya bilgi paylaşın (isteğe bağlı)..."
                />
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3">
              ⚠️ Rapor Göndermeden Önce
            </h3>
            <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
              <li>• Raporunuz moderatör ekibi tarafından incelenecektir</li>
              <li>• Yanlış veya kötü niyetli raporlar hesabınıza kısıtlama getirebilir</li>
              <li>• Mümkünse somut örnekler ve detaylar verin</li>
              <li>• Kişisel anlaşmazlıklar için rapor sistemini kullanmayın</li>
              <li>• Cevap süresi 24-48 saat arasındadır</li>
            </ul>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              İptal
            </button>
            
            <button
              type="submit"
              disabled={createReportMutation.isLoading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {createReportMutation.isLoading ? 'Gönderiliyor...' : 'Raporu Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReportPage;