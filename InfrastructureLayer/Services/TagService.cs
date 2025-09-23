using Microsoft.EntityFrameworkCore;
using AutoMapper;
using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Services
{
    public class TagService : ITagService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly AppDbContext _context;

        public TagService(IUnitOfWork unitOfWork, IMapper mapper, AppDbContext context)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _context = context;
        }

        public async Task<TagDto?> GetTagByIdAsync(int id)
        {
            var tag = await _unitOfWork.Tags.GetByIdAsync(id);
            return tag == null ? null : _mapper.Map<TagDto>(tag);
        }

        public async Task<TagDto?> GetTagByNameAsync(string name)
        {
            var tag = await _unitOfWork.Tags.FirstOrDefaultAsync(t => t.Name == name);
            return tag == null ? null : _mapper.Map<TagDto>(tag);
        }

        public async Task<IEnumerable<TagDto>> GetAllTagsAsync()
        {
            var tags = await _unitOfWork.Tags.GetAllAsync();
            return _mapper.Map<IEnumerable<TagDto>>(tags);
        }

        public async Task<IEnumerable<TagDto>> GetPopularTagsAsync(int count)
        {
            var tags = await _context.Tags
                .Include(t => t.GameTags)
                .Include(t => t.BlogPostTags)
                .OrderByDescending(t => t.GameTags.Count + t.BlogPostTags.Count)
                .Take(count)
                .ToListAsync();

            return _mapper.Map<IEnumerable<TagDto>>(tags);
        }

        public async Task<IEnumerable<TagDto>> SearchTagsAsync(string searchTerm)
        {
            var tags = await _unitOfWork.Tags.FindAsync(t => t.Name.Contains(searchTerm));
            return _mapper.Map<IEnumerable<TagDto>>(tags);
        }

        public async Task<TagDto> CreateTagAsync(CreateTagDto createTagDto)
        {
            // Check if tag name already exists
            var existingTag = await _unitOfWork.Tags.FirstOrDefaultAsync(t => t.Name == createTagDto.Name);
            if (existingTag != null)
                throw new InvalidOperationException("Bu etiket adı zaten mevcut.");

            var tag = _mapper.Map<Tag>(createTagDto);
            tag.CreatedDate = DateTime.UtcNow;
            // No UpdatedDate property in Tag entity

            await _unitOfWork.Tags.AddAsync(tag);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<TagDto>(tag);
        }

        public async Task<TagDto> UpdateTagAsync(int id, UpdateTagDto updateTagDto)
        {
            var tag = await _unitOfWork.Tags.GetByIdAsync(id);
            if (tag == null)
                throw new InvalidOperationException("Etiket bulunamadı.");

            // Check if new name already exists (if name is being changed)
            if (!string.IsNullOrEmpty(updateTagDto.Name) && updateTagDto.Name != tag.Name)
            {
                var existingTag = await _unitOfWork.Tags.FirstOrDefaultAsync(t => t.Name == updateTagDto.Name);
                if (existingTag != null)
                    throw new InvalidOperationException("Bu etiket adı zaten mevcut.");
            }

            _mapper.Map(updateTagDto, tag);
            // No UpdatedDate property in Tag entity

            _unitOfWork.Tags.Update(tag);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<TagDto>(tag);
        }

        public async Task DeleteTagAsync(int id)
        {
            var tag = await _unitOfWork.Tags.GetByIdAsync(id);
            if (tag == null)
                throw new InvalidOperationException("Etiket bulunamadı.");

            // Check if tag is used by any games or blog posts
            var gameTagCount = await _context.GameTags.CountAsync(gt => gt.TagId == id);
            var blogPostTagCount = await _context.BlogPostTags.CountAsync(bt => bt.TagId == id);
            
            if (gameTagCount > 0 || blogPostTagCount > 0)
                throw new InvalidOperationException("Bu etiket oyunlar veya blog yazıları tarafından kullanılıyor, silinemez.");

            _unitOfWork.Tags.Remove(tag);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<bool> IsTagNameExistsAsync(string name)
        {
            return await _unitOfWork.Tags.AnyAsync(t => t.Name == name);
        }
    }
}