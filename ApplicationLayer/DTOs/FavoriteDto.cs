using DomainLayer.Enums;

namespace ApplicationLayer.DTOs
{
    public class FavoriteDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public UserDto? User { get; set; }
        public FavoriteType FavoriteType { get; set; }
        public int TargetEntityId { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class CreateFavoriteDto
    {
        public FavoriteType FavoriteType { get; set; }
        public int TargetEntityId { get; set; }
    }
}