/**
 * Convert UTC date to Turkey timezone
 */
export const convertToTurkeyTime = (utcDate: string | Date): Date => {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  
  // If the date is invalid, return current time
  if (isNaN(date.getTime())) {
    return new Date();
  }

  // Turkey is UTC+3 timezone
  // Add 3 hours to UTC time to get Turkey time
  const turkeyOffset = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
  return new Date(date.getTime() + turkeyOffset);
};

export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return 'Tarih belirtilmemiş';
  
  try {
    const utcDate = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(utcDate.getTime())) {
      return 'Geçersiz tarih';
    }
    
    // Convert to Turkey time for display
    const turkeyDate = convertToTurkeyTime(utcDate);
    
    return turkeyDate.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'Geçersiz tarih';
  }
};

export const formatDateTime = (dateString: string | undefined | null): string => {
  if (!dateString) return 'Tarih belirtilmemiş';
  
  try {
    const utcDate = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(utcDate.getTime())) {
      return 'Geçersiz tarih';
    }
    
    // Convert to Turkey time for display
    const turkeyDate = convertToTurkeyTime(utcDate);
    
    return turkeyDate.toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Geçersiz tarih';
  }
};

export const formatRelativeTime = (dateString: string | undefined | null): string => {
  if (!dateString) return 'Bilinmiyor';
  
  try {
    const utcDate = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(utcDate.getTime())) {
      return 'Geçersiz tarih';
    }
    
    // Convert both dates to Turkey time for accurate comparison
    const turkeyDate = convertToTurkeyTime(utcDate);
    const nowUTC = new Date();
    const nowTurkey = convertToTurkeyTime(nowUTC);
    
    const diffInSeconds = Math.floor((nowTurkey.getTime() - turkeyDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Az önce';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} gün önce`;
    
    return formatDate(dateString);
  } catch (error) {
    return 'Geçersiz tarih';
  }
};

/**
 * Format last seen time specifically
 */
export const formatLastSeen = (utcDate: string | Date | null | undefined): string => {
  if (!utcDate) return 'Bilinmiyor';
  
  try {
    return `Son görülme: ${formatRelativeTime(typeof utcDate === 'string' ? utcDate : utcDate.toISOString())}`;
  } catch (error) {
    return 'Son görülme: Bilinmiyor';
  }
};