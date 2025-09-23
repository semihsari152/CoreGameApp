using Microsoft.EntityFrameworkCore;
using AutoMapper;
using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using DomainLayer.Enums;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Services
{
    public class UserGameStatusService : IUserGameStatusService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;

        public UserGameStatusService(IUnitOfWork unitOfWork, IMapper mapper, AppDbContext context, INotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<UserGameStatusDto?> GetUserGameStatusAsync(int userId, int gameId)
        {
            var userGameStatus = await _unitOfWork.UserGameStatuses.GetUserGameStatusAsync(userId, gameId);
            return userGameStatus == null ? null : _mapper.Map<UserGameStatusDto>(userGameStatus);
        }

        public async Task<IEnumerable<UserGameStatusDto>> GetUserGameStatusesAsync(int userId)
        {
            var userGameStatuses = await _unitOfWork.UserGameStatuses.GetUserGameStatusesByUserAsync(userId);
            return _mapper.Map<IEnumerable<UserGameStatusDto>>(userGameStatuses);
        }

        public async Task<IEnumerable<UserGameStatusDto>> GetGamesByStatusAsync(int userId, GameListType status)
        {
            var userGameStatuses = await _unitOfWork.UserGameStatuses.GetGamesByStatusAsync(userId, status);
            return _mapper.Map<IEnumerable<UserGameStatusDto>>(userGameStatuses);
        }

        public async Task<UserGameStatusDto> CreateOrUpdateUserGameStatusAsync(int userId, CreateUserGameStatusDto createDto)
        {
            // Check if the user already has a status for this game
            var existingStatus = await _unitOfWork.UserGameStatuses.GetUserGameStatusAsync(userId, createDto.GameId);
            
            UserGameStatusDto result;
            bool shouldNotify = false;
            
            if (existingStatus != null)
            {
                // Update existing status
                var oldStatus = existingStatus.Status;
                existingStatus.Status = createDto.Status;
                existingStatus.Notes = createDto.Notes;
                existingStatus.UpdatedDate = DateTime.UtcNow;

                _unitOfWork.UserGameStatuses.Update(existingStatus);
                await _unitOfWork.SaveChangesAsync();

                result = _mapper.Map<UserGameStatusDto>(existingStatus);
                shouldNotify = oldStatus != createDto.Status; // Only notify if status actually changed
            }
            else
            {
                // Create new status
                var newStatus = new UserGameStatus
                {
                    UserId = userId,
                    GameId = createDto.GameId,
                    Status = createDto.Status,
                    Notes = createDto.Notes,
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                };

                await _unitOfWork.UserGameStatuses.AddAsync(newStatus);
                await _unitOfWork.SaveChangesAsync();

                result = _mapper.Map<UserGameStatusDto>(newStatus);
                shouldNotify = true; // Always notify for new status
            }

            // Send notification for game status change
            if (shouldNotify)
            {
                try
                {
                    await SendGameStatusNotificationAsync(userId, createDto.GameId, createDto.Status);
                }
                catch (Exception ex)
                {
                    // Log notification error but don't fail the operation
                    Console.WriteLine($"Failed to send game status notification: {ex.Message}");
                }
            }

            return result;
        }

        public async Task<UserGameStatusDto> UpdateUserGameStatusAsync(int userId, int gameId, UpdateUserGameStatusDto updateDto)
        {
            var userGameStatus = await _unitOfWork.UserGameStatuses.GetUserGameStatusAsync(userId, gameId);
            if (userGameStatus == null)
                throw new InvalidOperationException("Kullanıcının bu oyun için durumu bulunamadı.");

            var oldStatus = userGameStatus.Status;
            userGameStatus.Status = updateDto.Status;
            userGameStatus.Notes = updateDto.Notes;
            userGameStatus.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.UserGameStatuses.Update(userGameStatus);
            await _unitOfWork.SaveChangesAsync();

            // Send notification if status changed
            if (oldStatus != updateDto.Status)
            {
                try
                {
                    await SendGameStatusNotificationAsync(userId, gameId, updateDto.Status);
                }
                catch (Exception ex)
                {
                    // Log notification error but don't fail the operation
                    Console.WriteLine($"Failed to send game status notification: {ex.Message}");
                }
            }

            return _mapper.Map<UserGameStatusDto>(userGameStatus);
        }

        public async Task RemoveUserGameStatusAsync(int userId, int gameId)
        {
            await _unitOfWork.UserGameStatuses.RemoveUserGameStatusAsync(userId, gameId);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<bool> UserHasGameStatusAsync(int userId, int gameId)
        {
            return await _unitOfWork.UserGameStatuses.UserHasGameStatusAsync(userId, gameId);
        }

        private async Task SendGameStatusNotificationAsync(int userId, int gameId, GameListType status)
        {
            // Get game details
            var game = await _context.Games.FindAsync(gameId);
            if (game == null) return;

            // Send self-notification for game status changes (user receives notification about their own action)
            try
            {
                await _notificationService.NotifyGameActivityAsync(userId, status, gameId, game.Name);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send game activity notification: {ex.Message}");
            }
        }
    }
}