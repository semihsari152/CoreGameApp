using Microsoft.EntityFrameworkCore;
using AutoMapper;
using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Services
{
    public class ForumCategoryService : IForumCategoryService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly AppDbContext _context;

        public ForumCategoryService(IUnitOfWork unitOfWork, IMapper mapper, AppDbContext context)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _context = context;
        }

        public async Task<ForumCategoryDto?> GetForumCategoryByIdAsync(int id)
        {
            var category = await _unitOfWork.ForumCategories.GetByIdAsync(id);
            return category == null ? null : _mapper.Map<ForumCategoryDto>(category);
        }

        public async Task<ForumCategoryDto?> GetForumCategoryByNameAsync(string name)
        {
            var category = await _unitOfWork.ForumCategories.FirstOrDefaultAsync(c => c.Name == name);
            return category == null ? null : _mapper.Map<ForumCategoryDto>(category);
        }

        public async Task<IEnumerable<ForumCategoryDto>> GetAllForumCategoriesAsync()
        {
            var categories = await _unitOfWork.ForumCategories.GetAllAsync();
            return _mapper.Map<IEnumerable<ForumCategoryDto>>(categories);
        }

        public async Task<IEnumerable<ForumCategoryDto>> GetActiveForumCategoriesAsync()
        {
            var categories = await _unitOfWork.ForumCategories.GetAllAsync();
            return _mapper.Map<IEnumerable<ForumCategoryDto>>(categories);
        }

        public async Task<IEnumerable<ForumCategoryDto>> GetForumCategoriesWithTopicsAsync()
        {
            var categories = await _context.ForumCategories
                .Include(c => c.ForumTopics)
                .Where(c => true)
                .OrderBy(c => c.Order)
                .ToListAsync();

            return _mapper.Map<IEnumerable<ForumCategoryDto>>(categories);
        }

        public async Task<ForumCategoryDto> CreateForumCategoryAsync(CreateForumCategoryDto createForumCategoryDto)
        {
            // Check if forum category name already exists
            var existingCategory = await _unitOfWork.ForumCategories.FirstOrDefaultAsync(c => c.Name == createForumCategoryDto.Name);
            if (existingCategory != null)
                throw new InvalidOperationException("Bu forum kategori adı zaten mevcut.");

            var category = _mapper.Map<ForumCategory>(createForumCategoryDto);
            category.CreatedDate = DateTime.UtcNow;
            // No UpdatedDate property in ForumCategory entity

            await _unitOfWork.ForumCategories.AddAsync(category);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<ForumCategoryDto>(category);
        }

        public async Task<ForumCategoryDto> UpdateForumCategoryAsync(int id, UpdateForumCategoryDto updateForumCategoryDto)
        {
            var category = await _unitOfWork.ForumCategories.GetByIdAsync(id);
            if (category == null)
                throw new InvalidOperationException("Forum kategorisi bulunamadı.");

            // Check if new name already exists (if name is being changed)
            if (!string.IsNullOrEmpty(updateForumCategoryDto.Name) && updateForumCategoryDto.Name != category.Name)
            {
                var existingCategory = await _unitOfWork.ForumCategories.FirstOrDefaultAsync(c => c.Name == updateForumCategoryDto.Name);
                if (existingCategory != null)
                    throw new InvalidOperationException("Bu forum kategori adı zaten mevcut.");
            }

            _mapper.Map(updateForumCategoryDto, category);
            // No UpdatedDate property in ForumCategory entity

            _unitOfWork.ForumCategories.Update(category);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<ForumCategoryDto>(category);
        }

        public async Task DeleteForumCategoryAsync(int id)
        {
            var category = await _unitOfWork.ForumCategories.GetByIdAsync(id);
            if (category == null)
                throw new InvalidOperationException("Forum kategorisi bulunamadı.");

            // Check if category has any topics
            var topicCount = await _context.ForumTopics.CountAsync(t => t.ForumCategoryId == id);
            if (topicCount > 0)
                throw new InvalidOperationException("Bu forum kategorisi konular tarafından kullanılıyor, silinemez.");

            _unitOfWork.ForumCategories.Remove(category);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<bool> IsForumCategoryNameExistsAsync(string name)
        {
            return await _unitOfWork.ForumCategories.AnyAsync(c => c.Name == name);
        }
    }
}