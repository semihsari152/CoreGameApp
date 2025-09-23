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
    public class BlogPostService : IBlogPostService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly AppDbContext _context;

        public BlogPostService(IUnitOfWork unitOfWork, IMapper mapper, AppDbContext context)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _context = context;
        }

        public async Task<BlogPostDto?> GetBlogPostByIdAsync(int id)
        {
            var blogPost = await _context.BlogPosts
                .Include(b => b.User)
                .Include(b => b.Game)
                .Include(b => b.Category)
                .Include(b => b.BlogPostTags)
                    .ThenInclude(bt => bt.Tag)
                .FirstOrDefaultAsync(b => b.Id == id);

            return blogPost == null ? null : _mapper.Map<BlogPostDto>(blogPost);
        }

        public async Task<IEnumerable<BlogPostDto>> GetAllBlogPostsAsync()
        {
            var blogPosts = await _context.BlogPosts
                .Include(b => b.User)
                .Include(b => b.Game)
                .Include(b => b.Category)
                .Include(b => b.BlogPostTags)
                    .ThenInclude(bt => bt.Tag)
                .OrderByDescending(b => b.CreatedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<BlogPostDto>>(blogPosts);
        }

        public async Task<IEnumerable<BlogPostDto>> GetBlogPostsByUserAsync(int userId)
        {
            var blogPosts = await _context.BlogPosts
                .Include(b => b.User)
                .Include(b => b.BlogPostTags)
                    .ThenInclude(bt => bt.Tag)
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.CreatedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<BlogPostDto>>(blogPosts);
        }

        public async Task<IEnumerable<BlogPostDto>> GetPublishedBlogPostsAsync()
        {
            var blogPosts = await _context.BlogPosts
                .Include(b => b.User)
                .Include(b => b.BlogPostTags)
                    .ThenInclude(bt => bt.Tag)
                .Where(b => b.IsPublished)
                .OrderByDescending(b => b.CreatedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<BlogPostDto>>(blogPosts);
        }

        public async Task<IEnumerable<BlogPostDto>> GetRecentBlogPostsAsync(int count)
        {
            var blogPosts = await _context.BlogPosts
                .Include(b => b.User)
                .Include(b => b.BlogPostTags)
                    .ThenInclude(bt => bt.Tag)
                .Where(b => b.IsPublished)
                .OrderByDescending(b => b.CreatedDate)
                .Take(count)
                .ToListAsync();

            return _mapper.Map<IEnumerable<BlogPostDto>>(blogPosts);
        }

        public async Task<IEnumerable<BlogPostDto>> SearchBlogPostsAsync(string searchTerm)
        {
            var blogPosts = await _context.BlogPosts
                .Include(b => b.User)
                .Include(b => b.BlogPostTags)
                    .ThenInclude(bt => bt.Tag)
                .Where(b => b.IsPublished && 
                           (b.Title.Contains(searchTerm) || 
                            b.Content.Contains(searchTerm) ||
                            b.Summary.Contains(searchTerm)))
                .OrderByDescending(b => b.CreatedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<BlogPostDto>>(blogPosts);
        }

        public async Task<IEnumerable<BlogPostDto>> GetBlogPostsByTagAsync(int tagId)
        {
            var blogPosts = await _context.BlogPosts
                .Include(b => b.User)
                .Include(b => b.BlogPostTags)
                    .ThenInclude(bt => bt.Tag)
                .Where(b => b.IsPublished && b.BlogPostTags.Any(bt => bt.TagId == tagId))
                .OrderByDescending(b => b.CreatedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<BlogPostDto>>(blogPosts);
        }

        public async Task<BlogPostDto> CreateBlogPostAsync(CreateBlogPostDto createBlogPostDto)
        {
            var blogPost = _mapper.Map<BlogPost>(createBlogPostDto);
            blogPost.CreatedDate = DateTime.UtcNow;
            blogPost.UpdatedDate = DateTime.UtcNow;

            await _unitOfWork.BlogPosts.AddAsync(blogPost);
            await _unitOfWork.SaveChangesAsync();

            // Add tags if provided
            if (createBlogPostDto.Tags != null && createBlogPostDto.Tags.Any())
            {
                foreach (var tagName in createBlogPostDto.Tags)
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
                        _context.Tags.Add(tag);
                        await _context.SaveChangesAsync();
                    }

                    // Create blog post tag relationship
                    var blogPostTag = new BlogPostTag
                    {
                        BlogPostId = blogPost.Id,
                        TagId = tag.Id,
                        CreatedDate = DateTime.UtcNow
                    };
                    _context.BlogPostTags.Add(blogPostTag);
                }
                await _context.SaveChangesAsync();
            }

            return await GetBlogPostByIdAsync(blogPost.Id) ?? throw new InvalidOperationException("Blog yazısı oluşturulamadı.");
        }

        public async Task<BlogPostDto> UpdateBlogPostAsync(int id, UpdateBlogPostDto updateBlogPostDto)
        {
            var blogPost = await _unitOfWork.BlogPosts.GetByIdAsync(id);
            if (blogPost == null)
                throw new InvalidOperationException("Blog yazısı bulunamadı.");

            _mapper.Map(updateBlogPostDto, blogPost);
            blogPost.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.BlogPosts.Update(blogPost);

            // Update tags if provided
            if (updateBlogPostDto.Tags != null)
            {
                var existingTags = await _context.BlogPostTags
                    .Where(bt => bt.BlogPostId == id)
                    .ToListAsync();

                _context.BlogPostTags.RemoveRange(existingTags);

                if (updateBlogPostDto.Tags.Any())
                {
                    foreach (var tagName in updateBlogPostDto.Tags)
                    {
                        if (string.IsNullOrWhiteSpace(tagName)) continue;

                        // Find or create tag
                        var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Name == tagName.Trim());
                        if (tag == null)
                        {
                            tag = new DomainLayer.Entities.Tag
                            {
                                Name = tagName.Trim(),
                                CreatedDate = DateTime.UtcNow
                            };
                            await _context.Tags.AddAsync(tag);
                            await _context.SaveChangesAsync(); // Save to get tag ID
                        }

                        // Add blog post-tag relationship
                        var blogPostTag = new BlogPostTag
                        {
                            BlogPostId = id,
                            TagId = tag.Id,
                            CreatedDate = DateTime.UtcNow
                        };
                        await _context.BlogPostTags.AddAsync(blogPostTag);
                    }
                }
            }

            await _unitOfWork.SaveChangesAsync();

            return await GetBlogPostByIdAsync(id) ?? throw new InvalidOperationException("Blog yazısı güncellenemedi.");
        }

        public async Task DeleteBlogPostAsync(int id)
        {
            var blogPost = await _unitOfWork.BlogPosts.GetByIdAsync(id);
            if (blogPost == null)
                throw new InvalidOperationException("Blog yazısı bulunamadı.");

            _unitOfWork.BlogPosts.Remove(blogPost);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task PublishBlogPostAsync(int id)
        {
            var blogPost = await _unitOfWork.BlogPosts.GetByIdAsync(id);
            if (blogPost == null)
                throw new InvalidOperationException("Blog yazısı bulunamadı.");

            blogPost.IsPublished = true;
            blogPost.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.BlogPosts.Update(blogPost);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task UnpublishBlogPostAsync(int id)
        {
            var blogPost = await _unitOfWork.BlogPosts.GetByIdAsync(id);
            if (blogPost == null)
                throw new InvalidOperationException("Blog yazısı bulunamadı.");

            blogPost.IsPublished = false;
            blogPost.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.BlogPosts.Update(blogPost);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task IncrementViewCountAsync(int id)
        {
            var blogPost = await _unitOfWork.BlogPosts.GetByIdAsync(id);
            if (blogPost == null)
                return;

            blogPost.ViewCount++;
            _unitOfWork.BlogPosts.Update(blogPost);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<bool> CanUserEditBlogPostAsync(int blogPostId, int userId)
        {
            var blogPost = await _unitOfWork.BlogPosts.GetByIdAsync(blogPostId);
            return blogPost != null && blogPost.UserId == userId;
        }
    }
}