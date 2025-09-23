namespace DomainLayer.Enums;

public enum MessageType
{
    // Normal metin mesajı
    Text = 0,
    
    // Fotoğraf
    Image = 1,
    
    // GIF
    Gif = 2,
    
    // Video
    Video = 3,
    
    // Ses mesajı
    Audio = 4,
    
    // Dosya
    File = 5,
    
    // Sistem mesajı (birisinin gruba katılması, ayrılması vb.)
    System = 6,
    
    // Oyun/profil linki paylaşımı
    Link = 7
}