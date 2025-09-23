using AutoMapper;
using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using DomainLayer.Enums;

namespace InfrastructureLayer.Services
{
    public class ReportService : IReportService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ReportService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ReportDto> CreateReportAsync(int reporterId, CreateReportDto createDto)
        {
            var report = _mapper.Map<Report>(createDto);
            report.ReporterId = reporterId;
            
            await _unitOfWork.Reports.AddAsync(report);
            await _unitOfWork.SaveChangesAsync();

            var created = await _unitOfWork.Reports.GetByIdAsync(report.Id);
            return _mapper.Map<ReportDto>(created);
        }

        public async Task<IEnumerable<ReportDto>> GetPendingReportsAsync()
        {
            var reports = await _unitOfWork.Reports.GetPendingReportsAsync();
            return _mapper.Map<IEnumerable<ReportDto>>(reports);
        }

        public async Task<IEnumerable<ReportDto>> GetReportsByStatusAsync(ReportStatus status)
        {
            var reports = await _unitOfWork.Reports.GetReportsByStatusAsync(status);
            return _mapper.Map<IEnumerable<ReportDto>>(reports);
        }

        public async Task<IEnumerable<ReportDto>> GetUserReportsAsync(int reporterId)
        {
            var reports = await _unitOfWork.Reports.GetUserReportsAsync(reporterId);
            return _mapper.Map<IEnumerable<ReportDto>>(reports);
        }

        public async Task<IEnumerable<ReportDto>> GetReportsForEntityAsync(ReportableType reportableType, int entityId)
        {
            var reports = await _unitOfWork.Reports.GetReportsForEntityAsync(reportableType, entityId);
            return _mapper.Map<IEnumerable<ReportDto>>(reports);
        }

        public async Task<ReportDto> ReviewReportAsync(int reportId, ReviewReportDto reviewDto, int reviewerId)
        {
            var report = await _unitOfWork.Reports.GetByIdAsync(reportId);
            if (report == null)
                throw new InvalidOperationException("Report bulunamadı.");

            report.Status = reviewDto.Status;
            report.ReviewNotes = reviewDto.ReviewNotes;
            report.ReviewedByUserId = reviewerId;
            report.ReviewedDate = DateTime.UtcNow;

            _unitOfWork.Reports.Update(report);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<ReportDto>(report);
        }

        public async Task<bool> HasUserReportedEntityAsync(int userId, ReportableType reportableType, int entityId)
        {
            return await _unitOfWork.Reports.HasUserReportedEntityAsync(userId, reportableType, entityId);
        }

        public async Task<int> GetPendingReportsCountAsync()
        {
            return await _unitOfWork.Reports.GetPendingReportsCountAsync();
        }

        public async Task<IEnumerable<ReportDto>> GetRecentReportsAsync(int count)
        {
            var reports = await _unitOfWork.Reports.GetRecentReportsAsync(count);
            return _mapper.Map<IEnumerable<ReportDto>>(reports);
        }

        public async Task ApproveReportAsync(int reportId, int reviewerId, string reviewNotes)
        {
            var report = await _unitOfWork.Reports.GetByIdAsync(reportId);
            if (report == null)
                throw new InvalidOperationException("Report bulunamadı.");

            report.Status = ReportStatus.Approved;
            report.ReviewedByUserId = reviewerId;
            report.ReviewNotes = reviewNotes;
            report.ReviewedDate = DateTime.UtcNow;

            _unitOfWork.Reports.Update(report);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task RejectReportAsync(int reportId, int reviewerId, string reviewNotes)
        {
            var report = await _unitOfWork.Reports.GetByIdAsync(reportId);
            if (report == null)
                throw new InvalidOperationException("Report bulunamadı.");

            report.Status = ReportStatus.Rejected;
            report.ReviewedByUserId = reviewerId;
            report.ReviewNotes = reviewNotes;
            report.ReviewedDate = DateTime.UtcNow;

            _unitOfWork.Reports.Update(report);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<ReportDto> GetReportByIdAsync(int reportId)
        {
            var report = await _unitOfWork.Reports.GetByIdAsync(reportId);
            if (report == null)
                throw new InvalidOperationException("Report bulunamadı.");

            return _mapper.Map<ReportDto>(report);
        }

        public async Task<(IEnumerable<ReportDto> data, int totalCount)> GetAllReportsAsync(object filters)
        {
            // Get all reports with user relationships
            var reports = await _unitOfWork.Reports.GetAllAsync();
            
            // Get users for Reporter and ReviewedByUser relationships
            var reporterIds = reports.Select(r => r.ReporterId).Distinct().ToList();
            var reviewerIds = reports.Where(r => r.ReviewedByUserId.HasValue)
                                   .Select(r => r.ReviewedByUserId.Value).Distinct().ToList();
            
            var allUserIds = reporterIds.Concat(reviewerIds).Distinct().ToList();
            var users = new Dictionary<int, User>();
            
            foreach (var userId in allUserIds)
            {
                var user = await _unitOfWork.Users.GetByIdAsync(userId);
                if (user != null)
                {
                    users[userId] = user;
                }
            }
            
            // Map reports to DTOs with user data
            var reportDtos = new List<ReportDto>();
            foreach (var report in reports)
            {
                var reportDto = _mapper.Map<ReportDto>(report);
                
                // Set Reporter
                if (users.ContainsKey(report.ReporterId))
                {
                    reportDto.Reporter = _mapper.Map<UserDto>(users[report.ReporterId]);
                }
                
                // Set ReviewedByUser
                if (report.ReviewedByUserId.HasValue && users.ContainsKey(report.ReviewedByUserId.Value))
                {
                    reportDto.ReviewedByUser = _mapper.Map<UserDto>(users[report.ReviewedByUserId.Value]);
                }
                
                // Set ReportableEntity information
                reportDto.ReportableEntity = await GetReportableEntityInfoAsync(report.ReportableType, report.ReportableEntityId);
                
                reportDtos.Add(reportDto);
            }
            
            return (reportDtos, reports.Count());
        }

        private async Task<ReportableEntityInfo?> GetReportableEntityInfoAsync(ReportableType reportableType, int entityId)
        {
            try
            {
                switch (reportableType)
                {
                    case ReportableType.User:
                        var user = await _unitOfWork.Users.GetByIdAsync(entityId);
                        if (user != null)
                        {
                            return new ReportableEntityInfo
                            {
                                Title = $"{user.FirstName} {user.LastName}".Trim(),
                                AuthorUsername = user.Username,
                                AuthorFullName = $"{user.FirstName} {user.LastName}".Trim(),
                                AuthorId = user.Id,
                                Url = $"/profile/{user.Username}",
                                CreatedDate = user.CreatedDate
                            };
                        }
                        break;

                    case ReportableType.BlogPost:
                        var blogPost = await _unitOfWork.BlogPosts.GetByIdAsync(entityId);
                        if (blogPost != null)
                        {
                            var author = await _unitOfWork.Users.GetByIdAsync(blogPost.UserId);
                            return new ReportableEntityInfo
                            {
                                Title = blogPost.Title,
                                AuthorUsername = author?.Username,
                                AuthorFullName = author != null ? $"{author.FirstName} {author.LastName}".Trim() : null,
                                AuthorId = blogPost.UserId,
                                Url = $"/blog/{blogPost.Slug}",
                                CreatedDate = blogPost.CreatedDate
                            };
                        }
                        break;

                    case ReportableType.ForumTopic:
                        var forumTopic = await _unitOfWork.ForumTopics.GetByIdAsync(entityId);
                        if (forumTopic != null)
                        {
                            var author = await _unitOfWork.Users.GetByIdAsync(forumTopic.UserId);
                            return new ReportableEntityInfo
                            {
                                Title = forumTopic.Title,
                                AuthorUsername = author?.Username,
                                AuthorFullName = author != null ? $"{author.FirstName} {author.LastName}".Trim() : null,
                                AuthorId = forumTopic.UserId,
                                Url = $"/forum/topic/{forumTopic.Id}",
                                CreatedDate = forumTopic.CreatedDate
                            };
                        }
                        break;

                    case ReportableType.Guide:
                        var guide = await _unitOfWork.Guides.GetByIdAsync(entityId);
                        if (guide != null)
                        {
                            var author = await _unitOfWork.Users.GetByIdAsync(guide.UserId);
                            return new ReportableEntityInfo
                            {
                                Title = guide.Title,
                                AuthorUsername = author?.Username,
                                AuthorFullName = author != null ? $"{author.FirstName} {author.LastName}".Trim() : null,
                                AuthorId = guide.UserId,
                                Url = $"/guides/{guide.Id}",
                                CreatedDate = guide.CreatedDate
                            };
                        }
                        break;

                    case ReportableType.Comment:
                        var comment = await _unitOfWork.Comments.GetByIdAsync(entityId);
                        if (comment != null)
                        {
                            var author = await _unitOfWork.Users.GetByIdAsync(comment.UserId);
                            var contentPreview = comment.Content.Length > 100 
                                ? comment.Content.Substring(0, 100) + "..." 
                                : comment.Content;
                            
                            return new ReportableEntityInfo
                            {
                                Title = $"Yorum: {contentPreview}",
                                AuthorUsername = author?.Username,
                                AuthorFullName = author != null ? $"{author.FirstName} {author.LastName}".Trim() : null,
                                AuthorId = comment.UserId,
                                Url = GetCommentUrl(comment),
                                CreatedDate = comment.CreatedDate
                            };
                        }
                        break;
                }

                return new ReportableEntityInfo
                {
                    Title = "Bilinmeyen İçerik",
                    AuthorUsername = "unknown",
                    AuthorFullName = "Bilinmeyen",
                    AuthorId = null,
                    Url = null,
                    CreatedDate = null
                };
            }
            catch
            {
                return new ReportableEntityInfo
                {
                    Title = "İçerik Yüklenemedi",
                    AuthorUsername = "unknown",
                    AuthorFullName = "Bilinmeyen",
                    AuthorId = null,
                    Url = null,
                    CreatedDate = null
                };
            }
        }

        private string? GetCommentUrl(Comment comment)
        {
            return comment.CommentableType switch
            {
                CommentableType.BlogPost => $"/blog/{comment.TargetEntityId}#comment-{comment.Id}",
                CommentableType.Guide => $"/guides/{comment.TargetEntityId}#comment-{comment.Id}",
                CommentableType.ForumTopic => $"/forum/topic/{comment.TargetEntityId}#comment-{comment.Id}",
                CommentableType.User => $"/profile/{GetUsernameById(comment.TargetEntityId)}#comment-{comment.Id}",
                CommentableType.Game => $"/games/{comment.TargetEntityId}#comment-{comment.Id}",
                _ => null
            };
        }

        private string GetUsernameById(int userId)
        {
            try
            {
                var user = _unitOfWork.Users.GetByIdAsync(userId).Result;
                return user?.Username ?? "unknown";
            }
            catch
            {
                return "unknown";
            }
        }

        public async Task<ReportDto> UpdateReportAsync(int reportId, UpdateReportDto updateDto, int reviewerId)
        {
            var report = await _unitOfWork.Reports.GetByIdAsync(reportId);
            if (report == null)
                throw new InvalidOperationException("Report bulunamadı.");

            if (updateDto.Status.HasValue)
                report.Status = updateDto.Status.Value;
            
            if (!string.IsNullOrEmpty(updateDto.ReviewNotes))
                report.ReviewNotes = updateDto.ReviewNotes;
            
            if (!string.IsNullOrEmpty(updateDto.AdminNote))
                report.ReviewNotes = updateDto.AdminNote; // Using ReviewNotes for AdminNote for now

            report.ReviewedByUserId = reviewerId;
            report.ReviewedDate = DateTime.UtcNow;

            _unitOfWork.Reports.Update(report);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<ReportDto>(report);
        }

        public async Task<ReportDto> UpdateReportStatusAsync(int reportId, string status, int reviewerId)
        {
            var report = await _unitOfWork.Reports.GetByIdAsync(reportId);
            if (report == null)
                throw new InvalidOperationException("Report bulunamadı.");

            if (Enum.TryParse<ReportStatus>(status, out var reportStatus))
            {
                report.Status = reportStatus;
            }

            report.ReviewedByUserId = reviewerId;
            report.ReviewedDate = DateTime.UtcNow;

            _unitOfWork.Reports.Update(report);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<ReportDto>(report);
        }
    }
}