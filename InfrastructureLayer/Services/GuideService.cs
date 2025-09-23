using Microsoft.EntityFrameworkCore;
using AutoMapper;
using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using ApplicationLayer.Utils;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using DomainLayer.Enums;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Services
{
    public class GuideService : IGuideService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly AppDbContext _context;

        public GuideService(IUnitOfWork unitOfWork, IMapper mapper, AppDbContext context)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _context = context;
        }

        public async Task<GuideDto?> GetGuideByIdAsync(int id)
        {
            var guide = await _context.Guides
                .Include(g => g.User)
                .Include(g => g.Game)
                .Include(g => g.GuideCategory)
                .Include(g => g.GuideTags)
                    .ThenInclude(gt => gt.Tag)
                .FirstOrDefaultAsync(g => g.Id == id);

            return guide == null ? null : _mapper.Map<GuideDto>(guide);
        }

        public async Task<IEnumerable<GuideDto>> GetAllGuidesAsync()
        {
            var guides = await _context.Guides
                .Include(g => g.User)
                .Include(g => g.Game)
                .Include(g => g.GuideCategory)
                .Include(g => g.GuideTags)
                    .ThenInclude(gt => gt.Tag)
                .OrderByDescending(g => g.CreatedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<GuideDto>>(guides);
        }

        public async Task<IEnumerable<GuideDto>> GetGuidesByGameAsync(int gameId)
        {
            var guides = await _context.Guides
                .Include(g => g.User)
                .Include(g => g.Game)
                .Where(g => g.GameId == gameId)
                .OrderByDescending(g => g.CreatedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<GuideDto>>(guides);
        }

        public async Task<IEnumerable<GuideDto>> GetGuidesByUserAsync(int userId)
        {
            var guides = await _context.Guides
                .Include(g => g.User)
                .Include(g => g.Game)
                .Where(g => g.UserId == userId)
                .OrderByDescending(g => g.CreatedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<GuideDto>>(guides);
        }

        public async Task<IEnumerable<GuideDto>> GetPublishedGuidesAsync()
        {
            var guides = await _context.Guides
                .Include(g => g.User)
                .Include(g => g.Game)
                .Where(g => g.IsPublished)
                .OrderByDescending(g => g.CreatedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<GuideDto>>(guides);
        }

        public async Task<IEnumerable<GuideDto>> GetTopRatedGuidesAsync(int count)
        {
            var guides = await _context.Guides
                .Include(g => g.User)
                .Include(g => g.Game)
                .Where(g => g.IsPublished)
                .OrderByDescending(g => g.ViewCount)
                .Take(count)
                .ToListAsync();

            return _mapper.Map<IEnumerable<GuideDto>>(guides);
        }

        public async Task<IEnumerable<GuideDto>> GetRecentGuidesAsync(int count)
        {
            var guides = await _context.Guides
                .Include(g => g.User)
                .Include(g => g.Game)
                .Where(g => g.IsPublished)
                .OrderByDescending(g => g.CreatedDate)
                .Take(count)
                .ToListAsync();

            return _mapper.Map<IEnumerable<GuideDto>>(guides);
        }

        public async Task<IEnumerable<GuideDto>> SearchGuidesAsync(string searchTerm)
        {
            var guides = await _context.Guides
                .Include(g => g.User)
                .Include(g => g.Game)
                .Where(g => g.IsPublished && 
                           (g.Title.Contains(searchTerm) || 
                            g.Summary.Contains(searchTerm) ||
                            g.Game.Name.Contains(searchTerm)))
                .OrderByDescending(g => g.CreatedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<GuideDto>>(guides);
        }

        public async Task<GuideDto> CreateGuideAsync(CreateGuideDto createGuideDto)
        {
            var guide = _mapper.Map<Guide>(createGuideDto);
            
            // Generate slug
            var baseSlug = SlugGenerator.GenerateSlug(createGuideDto.Title);
            guide.Slug = SlugGenerator.EnsureUnique(baseSlug, slug => 
                _context.Guides.Any(g => g.Slug == slug));
            
            guide.CreatedDate = DateTime.UtcNow;
            guide.UpdatedDate = DateTime.UtcNow;
            guide.IsPublished = true; // Auto-publish guides

            await _unitOfWork.Guides.AddAsync(guide);
            await _unitOfWork.SaveChangesAsync();

            // Add guide blocks if provided
            if (createGuideDto.GuideBlocks?.Any() == true)
            {
                foreach (var blockDto in createGuideDto.GuideBlocks)
                {
                    var guideBlock = new GuideBlock
                    {
                        GuideId = guide.Id,
                        BlockType = blockDto.BlockType,
                        Order = blockDto.Order,
                        Content = blockDto.Content,
                        MediaUrl = blockDto.MediaUrl,
                        Caption = blockDto.Caption,
                        Title = blockDto.Title,
                        Metadata = blockDto.Metadata,
                        CreatedDate = DateTime.UtcNow
                    };
                    await _context.GuideBlocks.AddAsync(guideBlock);
                }
            }

            // Add tags if provided
            if (createGuideDto.Tags?.Any() == true)
            {
                foreach (var tagName in createGuideDto.Tags)
                {
                    if (string.IsNullOrWhiteSpace(tagName)) continue;

                    // Find or create tag
                    var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Name == tagName.Trim());
                    if (tag == null)
                    {
                        tag = new Tag
                        {
                            Name = tagName.Trim(),
                            CreatedDate = DateTime.UtcNow
                        };
                        await _context.Tags.AddAsync(tag);
                        await _context.SaveChangesAsync();
                    }

                    // Add guide-tag relationship
                    var guideTag = new GuideTag
                    {
                        GuideId = guide.Id,
                        TagId = tag.Id,
                        CreatedDate = DateTime.UtcNow
                    };
                    await _context.GuideTags.AddAsync(guideTag);
                }
            }

            await _context.SaveChangesAsync();

            return await GetGuideByIdAsync(guide.Id) ?? throw new InvalidOperationException("Rehber oluşturulamadı.");
        }

        public async Task<GuideDto> UpdateGuideAsync(int id, UpdateGuideDto updateGuideDto)
        {
            var guide = await _context.Guides
                .Include(g => g.GuideBlocks)
                .Include(g => g.GuideTags)
                .FirstOrDefaultAsync(g => g.Id == id);
                
            if (guide == null)
                throw new InvalidOperationException("Rehber bulunamadı.");

            // Update basic guide properties
            if (!string.IsNullOrEmpty(updateGuideDto.Title))
            {
                guide.Title = updateGuideDto.Title;
                // Update slug when title changes
                var baseSlug = SlugGenerator.GenerateSlug(updateGuideDto.Title);
                guide.Slug = SlugGenerator.EnsureUnique(baseSlug, slug => 
                    _context.Guides.Any(g => g.Slug == slug && g.Id != id));
            }
            if (!string.IsNullOrEmpty(updateGuideDto.Summary))
                guide.Summary = updateGuideDto.Summary;
            if (!string.IsNullOrEmpty(updateGuideDto.ThumbnailUrl))
                guide.ThumbnailUrl = updateGuideDto.ThumbnailUrl;
            if (!string.IsNullOrEmpty(updateGuideDto.Difficulty))
                guide.Difficulty = updateGuideDto.Difficulty;
            if (updateGuideDto.GuideCategoryId.HasValue)
                guide.GuideCategoryId = updateGuideDto.GuideCategoryId;
            if (updateGuideDto.IsPublished.HasValue)
                guide.IsPublished = updateGuideDto.IsPublished.Value;
            if (updateGuideDto.IsFeatured.HasValue)
                guide.IsFeatured = updateGuideDto.IsFeatured.Value;
                
            guide.UpdatedDate = DateTime.UtcNow;

            // Update GuideBlocks
            if (updateGuideDto.GuideBlocks?.Any() == true)
            {
                // Remove existing blocks that are not in the update list
                var existingBlockIds = guide.GuideBlocks.Select(b => b.Id).ToList();
                var updateBlockIds = updateGuideDto.GuideBlocks
                    .Where(b => b.Id.HasValue)
                    .Select(b => b.Id.Value)
                    .ToList();

                var blocksToRemove = guide.GuideBlocks
                    .Where(b => !updateBlockIds.Contains(b.Id))
                    .ToList();

                foreach (var blockToRemove in blocksToRemove)
                {
                    _context.GuideBlocks.Remove(blockToRemove);
                }

                // Update existing blocks and add new ones
                foreach (var blockDto in updateGuideDto.GuideBlocks)
                {
                    if (blockDto.Id.HasValue)
                    {
                        // Update existing block
                        var existingBlock = guide.GuideBlocks.FirstOrDefault(b => b.Id == blockDto.Id.Value);
                        if (existingBlock != null)
                        {
                            existingBlock.BlockType = blockDto.BlockType;
                            existingBlock.Order = blockDto.Order;
                            existingBlock.Content = blockDto.Content;
                            existingBlock.MediaUrl = blockDto.MediaUrl;
                            existingBlock.Caption = blockDto.Caption;
                            existingBlock.Title = blockDto.Title;
                            existingBlock.Metadata = blockDto.Metadata;
                            existingBlock.UpdatedDate = DateTime.UtcNow;
                        }
                    }
                    else
                    {
                        // Add new block
                        var newBlock = new GuideBlock
                        {
                            GuideId = guide.Id,
                            BlockType = blockDto.BlockType,
                            Order = blockDto.Order,
                            Content = blockDto.Content,
                            MediaUrl = blockDto.MediaUrl,
                            Caption = blockDto.Caption,
                            Title = blockDto.Title,
                            Metadata = blockDto.Metadata,
                            CreatedDate = DateTime.UtcNow,
                            UpdatedDate = DateTime.UtcNow
                        };
                        await _context.GuideBlocks.AddAsync(newBlock);
                    }
                }
            }

            // Update Tags
            if (updateGuideDto.Tags != null)
            {
                // Remove existing guide tags
                var existingGuideTags = guide.GuideTags.ToList();
                foreach (var guideTag in existingGuideTags)
                {
                    _context.GuideTags.Remove(guideTag);
                }

                // Add new tags
                foreach (var tagName in updateGuideDto.Tags)
                {
                    if (string.IsNullOrWhiteSpace(tagName)) continue;

                    // Find or create tag
                    var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Name == tagName.Trim());
                    if (tag == null)
                    {
                        tag = new Tag
                        {
                            Name = tagName.Trim(),
                            CreatedDate = DateTime.UtcNow
                        };
                        await _context.Tags.AddAsync(tag);
                        await _context.SaveChangesAsync(); // Save to get tag ID
                    }

                    // Add guide-tag relationship
                    var newGuideTag = new GuideTag
                    {
                        GuideId = guide.Id,
                        TagId = tag.Id,
                        CreatedDate = DateTime.UtcNow
                    };
                    await _context.GuideTags.AddAsync(newGuideTag);
                }
            }

            await _context.SaveChangesAsync();

            return await GetGuideByIdAsync(id) ?? throw new InvalidOperationException("Rehber güncellenemedi.");
        }

        public async Task DeleteGuideAsync(int id)
        {
            var guide = await _unitOfWork.Guides.GetByIdAsync(id);
            if (guide == null)
                throw new InvalidOperationException("Rehber bulunamadı.");

            _unitOfWork.Guides.Remove(guide);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task PublishGuideAsync(int id)
        {
            var guide = await _unitOfWork.Guides.GetByIdAsync(id);
            if (guide == null)
                throw new InvalidOperationException("Rehber bulunamadı.");

            guide.IsPublished = true;
            guide.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.Guides.Update(guide);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task UnpublishGuideAsync(int id)
        {
            var guide = await _unitOfWork.Guides.GetByIdAsync(id);
            if (guide == null)
                throw new InvalidOperationException("Rehber bulunamadı.");

            guide.IsPublished = false;
            guide.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.Guides.Update(guide);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task IncrementViewCountAsync(int id)
        {
            var guide = await _unitOfWork.Guides.GetByIdAsync(id);
            if (guide == null)
                return;

            guide.ViewCount++;
            _unitOfWork.Guides.Update(guide);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<bool> CanUserEditGuideAsync(int guideId, int userId)
        {
            var guide = await _unitOfWork.Guides.GetByIdAsync(guideId);
            return guide != null && guide.UserId == userId;
        }
    }
}