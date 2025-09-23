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
    public class ForumTopicService : IForumTopicService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly AppDbContext _context;

        public ForumTopicService(IUnitOfWork unitOfWork, IMapper mapper, AppDbContext context)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _context = context;
        }

        public async Task<ForumTopicDto?> GetForumTopicByIdAsync(int id)
        {
            var topic = await _context.ForumTopics
                .Include(t => t.User)
                .Include(t => t.ForumCategory)
                .FirstOrDefaultAsync(t => t.Id == id);

            return topic == null ? null : _mapper.Map<ForumTopicDto>(topic);
        }

        public async Task<IEnumerable<ForumTopicDto>> GetAllForumTopicsAsync()
        {
            var topics = await _context.ForumTopics
                .Include(t => t.User)
                .Include(t => t.ForumCategory)
                .OrderByDescending(t => t.CreatedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<ForumTopicDto>>(topics);
        }

        public async Task<IEnumerable<ForumTopicDto>> GetTopicsByCategoryAsync(int categoryId)
        {
            var topics = await _context.ForumTopics
                .Include(t => t.User)
                .Include(t => t.ForumCategory)
                .Where(t => t.ForumCategoryId == categoryId)
                .OrderByDescending(t => t.IsSticky)
                .ThenByDescending(t => t.CreatedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<ForumTopicDto>>(topics);
        }

        public async Task<IEnumerable<ForumTopicDto>> GetTopicsByUserAsync(int userId)
        {
            var topics = await _context.ForumTopics
                .Include(t => t.User)
                .Include(t => t.ForumCategory)
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<ForumTopicDto>>(topics);
        }

        public async Task<IEnumerable<ForumTopicDto>> GetStickyTopicsAsync()
        {
            var topics = await _context.ForumTopics
                .Include(t => t.User)
                .Include(t => t.ForumCategory)
                .Where(t => t.IsSticky)
                .OrderByDescending(t => t.CreatedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<ForumTopicDto>>(topics);
        }

        public async Task<IEnumerable<ForumTopicDto>> GetRecentTopicsAsync(int count)
        {
            var topics = await _context.ForumTopics
                .Include(t => t.User)
                .Include(t => t.ForumCategory)
                .OrderByDescending(t => t.CreatedDate)
                .Take(count)
                .ToListAsync();

            return _mapper.Map<IEnumerable<ForumTopicDto>>(topics);
        }

        public async Task<IEnumerable<ForumTopicDto>> SearchTopicsAsync(string searchTerm)
        {
            var topics = await _context.ForumTopics
                .Include(t => t.User)
                .Include(t => t.ForumCategory)
                .Where(t => t.Title.Contains(searchTerm) || 
                           t.Content.Contains(searchTerm))
                .OrderByDescending(t => t.CreatedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<ForumTopicDto>>(topics);
        }

        public async Task<ForumTopicDto> CreateForumTopicAsync(CreateForumTopicDto createForumTopicDto)
        {
            var topic = _mapper.Map<ForumTopic>(createForumTopicDto);
            topic.CreatedDate = DateTime.UtcNow;
            topic.UpdatedDate = DateTime.UtcNow;

            await _unitOfWork.ForumTopics.AddAsync(topic);
            await _unitOfWork.SaveChangesAsync();

            return await GetForumTopicByIdAsync(topic.Id) ?? throw new InvalidOperationException("Forum konusu oluşturulamadı.");
        }

        public async Task<ForumTopicDto> UpdateForumTopicAsync(int id, UpdateForumTopicDto updateForumTopicDto)
        {
            var topic = await _unitOfWork.ForumTopics.GetByIdAsync(id);
            if (topic == null)
                throw new InvalidOperationException("Forum konusu bulunamadı.");

            _mapper.Map(updateForumTopicDto, topic);
            topic.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.ForumTopics.Update(topic);
            await _unitOfWork.SaveChangesAsync();

            return await GetForumTopicByIdAsync(id) ?? throw new InvalidOperationException("Forum konusu güncellenemedi.");
        }

        public async Task DeleteForumTopicAsync(int id)
        {
            var topic = await _unitOfWork.ForumTopics.GetByIdAsync(id);
            if (topic == null)
                throw new InvalidOperationException("Forum konusu bulunamadı.");

            _unitOfWork.ForumTopics.Remove(topic);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task IncrementViewCountAsync(int id)
        {
            var topic = await _unitOfWork.ForumTopics.GetByIdAsync(id);
            if (topic == null)
                return;

            topic.ViewCount++;
            _unitOfWork.ForumTopics.Update(topic);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task LockTopicAsync(int id)
        {
            var topic = await _unitOfWork.ForumTopics.GetByIdAsync(id);
            if (topic == null)
                throw new InvalidOperationException("Forum konusu bulunamadı.");

            topic.IsLocked = true;
            topic.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.ForumTopics.Update(topic);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task UnlockTopicAsync(int id)
        {
            var topic = await _unitOfWork.ForumTopics.GetByIdAsync(id);
            if (topic == null)
                throw new InvalidOperationException("Forum konusu bulunamadı.");

            topic.IsLocked = false;
            topic.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.ForumTopics.Update(topic);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task MakeStickyAsync(int id)
        {
            var topic = await _unitOfWork.ForumTopics.GetByIdAsync(id);
            if (topic == null)
                throw new InvalidOperationException("Forum konusu bulunamadı.");

            topic.IsSticky = true;
            topic.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.ForumTopics.Update(topic);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task RemoveStickyAsync(int id)
        {
            var topic = await _unitOfWork.ForumTopics.GetByIdAsync(id);
            if (topic == null)
                throw new InvalidOperationException("Forum konusu bulunamadı.");

            topic.IsSticky = false;
            topic.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.ForumTopics.Update(topic);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<bool> CanUserEditTopicAsync(int topicId, int userId)
        {
            var topic = await _unitOfWork.ForumTopics.GetByIdAsync(topicId);
            return topic != null && topic.UserId == userId;
        }
    }
}