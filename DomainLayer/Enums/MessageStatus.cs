namespace DomainLayer.Enums;

public enum MessageStatus
{
    // Mesaj gönderildi
    Sent = 0,
    
    // Mesaj teslim edildi (alıcıya ulaştı)
    Delivered = 1,
    
    // Mesaj okundu
    Read = 2,
    
    // Mesaj gönderilemedi
    Failed = 3
}