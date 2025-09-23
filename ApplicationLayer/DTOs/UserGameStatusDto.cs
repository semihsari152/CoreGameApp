using DomainLayer.Enums;

namespace ApplicationLayer.DTOs
{
    public class UserGameStatusDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int GameId { get; set; }
        public GameDto? Game { get; set; }
        public GameListType Status { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime UpdatedDate { get; set; }
    }

    public class CreateUserGameStatusDto
    {
        public int GameId { get; set; }
        public GameListType Status { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateUserGameStatusDto
    {
        public GameListType Status { get; set; }
        public string? Notes { get; set; }
    }
}