namespace DomainLayer.Enums;

public enum FriendshipStatus
{
    // Arkadaşlık isteği gönderildi, beklemede
    Pending = 0,
    
    // Arkadaşlık isteği kabul edildi
    Accepted = 1,
    
    // Arkadaşlık isteği reddedildi
    Declined = 2,
    
    // Arkadaşlık iptal edildi (bir taraf arkadaşlıktan çıktı)
    Cancelled = 3,
    
    // Bir kullanıcı diğerini blokładı
    Blocked = 4
}