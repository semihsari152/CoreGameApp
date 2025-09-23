using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoMapper;
using BCrypt.Net;
using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using DomainLayer.Enums;

namespace InfrastructureLayer.Services
{
    public class UserService : IUserService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;

        public UserService(IUnitOfWork unitOfWork, IMapper mapper, IConfiguration configuration, IEmailService emailService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _configuration = configuration;
            _emailService = emailService;
        }

        public async Task<UserDto?> GetUserByIdAsync(int id)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);
            return user == null ? null : _mapper.Map<UserDto>(user);
        }

        public async Task<UserDto?> GetUserByEmailAsync(string email)
        {
            var user = await _unitOfWork.Users.FirstOrDefaultAsync(u => u.Email == email);
            return user == null ? null : _mapper.Map<UserDto>(user);
        }

        public async Task<UserDto?> GetUserByUsernameAsync(string username)
        {
            var user = await _unitOfWork.Users.FirstOrDefaultAsync(u => u.Username == username);
            return user == null ? null : _mapper.Map<UserDto>(user);
        }

        public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
        {
            var users = await _unitOfWork.Users.GetAllAsync();
            return _mapper.Map<IEnumerable<UserDto>>(users);
        }

        public async Task<UserDto> CreateUserAsync(CreateUserDto createUserDto)
        {
            // Check if username already exists
            var existingUser = await _unitOfWork.Users.FirstOrDefaultAsync(u => u.Username == createUserDto.Username);
            if (existingUser != null)
                throw new InvalidOperationException("Bu kullanıcı adı zaten alınmış.");

            // Check if email already exists
            var existingEmail = await _unitOfWork.Users.FirstOrDefaultAsync(u => u.Email == createUserDto.Email);
            if (existingEmail != null)
                throw new InvalidOperationException("Bu e-posta adresi zaten kayıtlı.");

            var user = _mapper.Map<User>(createUserDto);
            user.PasswordHash = await HashPasswordAsync(createUserDto.Password);
            user.CreatedDate = DateTime.UtcNow;
            user.LastLoginDate = DateTime.UtcNow;

            // Generate email verification token
            var verificationToken = Guid.NewGuid().ToString();
            user.EmailVerificationToken = verificationToken;
            user.EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24);
            user.IsEmailVerified = false; // Ensure new users need email verification

            await _unitOfWork.Users.AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            // Send verification email asynchronously (don't block registration)
            try
            {
                await _emailService.SendEmailVerificationAsync(user.Email, user.Username, verificationToken);
            }
            catch (Exception ex)
            {
                // Log error but don't fail registration
                Console.WriteLine($"Failed to send verification email to {user.Email}: {ex.Message}");
            }

            return _mapper.Map<UserDto>(user);
        }

        public async Task<UserDto> UpdateUserAsync(int id, UpdateUserDto updateUserDto)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);
            if (user == null)
                throw new InvalidOperationException("Kullanıcı bulunamadı.");

            // Check if username is being changed and if it's already taken
            if (!string.IsNullOrEmpty(updateUserDto.Username) && updateUserDto.Username != user.Username)
            {
                var existingUser = await _unitOfWork.Users.FirstOrDefaultAsync(u => u.Username == updateUserDto.Username);
                if (existingUser != null)
                    throw new InvalidOperationException("Bu kullanıcı adı zaten alınmış.");
            }

            _mapper.Map(updateUserDto, user);
            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<UserDto>(user);
        }


        public async Task VerifyEmailAsync(int userId)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException("Kullanıcı bulunamadı.");

            user.IsEmailVerified = true;
            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task ChangePasswordAsync(int userId, string currentPassword, string newPassword)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException("Kullanıcı bulunamadı.");

            if (!await ValidatePasswordHashAsync(currentPassword, user.PasswordHash))
                throw new InvalidOperationException("Mevcut şifre yanlış.");

            user.PasswordHash = await HashPasswordAsync(newPassword);
            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<string> GenerateJwtTokenAsync(UserDto user)
        {
            var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
            var jwtIssuer = _configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer not configured");
            var jwtAudience = _configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience not configured");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(1),
                signingCredentials: creds);

            return await Task.FromResult(new JwtSecurityTokenHandler().WriteToken(token));
        }

        public async Task<bool> ValidatePasswordAsync(string username, string password)
        {
            var user = await _unitOfWork.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null)
                return false;

            return await Task.FromResult(BCrypt.Net.BCrypt.Verify(password, user.PasswordHash));
        }

        private async Task<bool> ValidatePasswordHashAsync(string password, string hashedPassword)
        {
            return await Task.FromResult(BCrypt.Net.BCrypt.Verify(password, hashedPassword));
        }

        public async Task<string> HashPasswordAsync(string password)
        {
            return await Task.FromResult(BCrypt.Net.BCrypt.HashPassword(password));
        }

        public async Task<IEnumerable<UserDto>> GetActiveUsersAsync()
        {
            var users = await _unitOfWork.Users.FindAsync(u => u.IsActive);
            return _mapper.Map<IEnumerable<UserDto>>(users);
        }

        public async Task<IEnumerable<UserDto>> GetUsersByRoleAsync(DomainLayer.Enums.UserRole role)
        {
            var users = await _unitOfWork.Users.FindAsync(u => u.Role == role);
            return _mapper.Map<IEnumerable<UserDto>>(users);
        }

        public async Task<IEnumerable<UserDto>> GetTopUsersByXPAsync(int count)
        {
            var users = await _unitOfWork.Users.GetAllAsync();
            var topUsers = users.OrderByDescending(u => u.XP).Take(count);
            return _mapper.Map<IEnumerable<UserDto>>(topUsers);
        }

        public async Task<bool> IsUsernameExistsAsync(string username)
        {
            var user = await _unitOfWork.Users.FirstOrDefaultAsync(u => u.Username == username);
            return user != null;
        }

        public async Task<bool> IsEmailExistsAsync(string email)
        {
            var user = await _unitOfWork.Users.FirstOrDefaultAsync(u => u.Email == email);
            return user != null;
        }

        public async Task UpdateLastLoginAsync(int userId)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException("Kullanıcı bulunamadı.");

            user.LastLoginDate = DateTime.UtcNow;
            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task UpdateUserXPAsync(int userId, int xpAmount)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException("Kullanıcı bulunamadı.");

            user.XP += xpAmount;
            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();
        }


        public async Task SendPasswordResetCodeAsync(string email)
        {
            var user = await _unitOfWork.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                throw new InvalidOperationException("Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.");

            // Generate a 6-digit reset code
            var resetCode = new Random().Next(100000, 999999).ToString();
            var expireTime = DateTime.UtcNow.AddMinutes(15); // 15 minutes expiry

            // Store reset code in user record (you might want to create a separate table for this)
            user.PasswordResetToken = resetCode;
            user.PasswordResetTokenExpiry = expireTime;
            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            // Send email with reset code
            await _emailService.SendPasswordResetEmailAsync(email, resetCode, user.Username);
        }

        public async Task ResetPasswordAsync(string email, string code, string newPassword)
        {
            var user = await _unitOfWork.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                throw new InvalidOperationException("Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.");

            // Verify reset code and expiry
            if (user.PasswordResetToken != code)
                throw new InvalidOperationException("Geçersiz doğrulama kodu.");

            if (user.PasswordResetTokenExpiry == null || user.PasswordResetTokenExpiry < DateTime.UtcNow)
                throw new InvalidOperationException("Doğrulama kodunun süresi dolmuş. Lütfen yeni bir kod talep edin.");

            // Update password and clear reset token
            user.PasswordHash = await HashPasswordAsync(newPassword);
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpiry = null;
            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();
        }


        public async Task<AuthenticationResponseDto> GoogleLoginAsync(string token)
        {
            // TODO: Implement Google OAuth token verification
            // For now, throw not implemented exception
            throw new NotImplementedException("Google login özelliği henüz implement edilmedi.");
        }

        public async Task<UserStatsDto?> GetUserStatsAsync(int userId)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
                return null;

            // Simple counts - handle exceptions gracefully
            int gameRatingsCount = 0;
            int guidesCount = 0;
            int forumTopicsCount = 0;
            int blogPostsCount = 0;
            int commentsCount = 0;
            int likesReceived = 0;
            int dislikesReceived = 0;

            try
            {
                var gameRatings = await _unitOfWork.GameRatings.GetAllAsync();
                gameRatingsCount = gameRatings.Count(gr => gr.UserId == userId);
                
                var guides = await _unitOfWork.Guides.GetAllAsync();
                guidesCount = guides.Count(g => g.UserId == userId);
                
                var forumTopics = await _unitOfWork.ForumTopics.GetAllAsync();
                forumTopicsCount = forumTopics.Count(ft => ft.UserId == userId);
                
                var blogPosts = await _unitOfWork.BlogPosts.GetAllAsync();
                blogPostsCount = blogPosts.Count(bp => bp.UserId == userId);
                
                var comments = await _unitOfWork.Comments.GetAllAsync();
                commentsCount = comments.Count(c => c.UserId == userId);
                
                // Count likes/dislikes received by checking content created by this user
                var allLikes = await _unitOfWork.Likes.GetAllAsync();
                var userComments = comments.Where(c => c.UserId == userId).Select(c => c.Id).ToList();
                var userGuides = guides.Where(g => g.UserId == userId).Select(g => g.Id).ToList();
                var userBlogs = blogPosts.Where(b => b.UserId == userId).Select(b => b.Id).ToList();
                var userTopics = forumTopics.Where(t => t.UserId == userId).Select(t => t.Id).ToList();
                
                // Likes on user's comments
                var commentLikes = allLikes.Where(l => l.LikableType == LikableType.Comment && userComments.Contains(l.TargetEntityId));
                // Likes on user's guides 
                var guideLikes = allLikes.Where(l => l.LikableType == LikableType.Guide && userGuides.Contains(l.TargetEntityId));
                // Likes on user's blogs
                var blogLikes = allLikes.Where(l => l.LikableType == LikableType.BlogPost && userBlogs.Contains(l.TargetEntityId));
                // Likes on user's forum topics
                var topicLikes = allLikes.Where(l => l.LikableType == LikableType.ForumTopic && userTopics.Contains(l.TargetEntityId));
                // Direct likes on user profile
                var profileLikes = allLikes.Where(l => l.LikableType == LikableType.User && l.TargetEntityId == userId);
                
                var allUserLikes = commentLikes.Concat(guideLikes).Concat(blogLikes).Concat(topicLikes).Concat(profileLikes);
                
                likesReceived = allUserLikes.Count(l => l.IsLike);
                dislikesReceived = allUserLikes.Count(l => !l.IsLike);
            }
            catch
            {
                // If any repository fails, continue with 0 counts
            }

            return new UserStatsDto
            {
                TotalXP = user.XP,
                Level = user.Level,
                GamesRated = gameRatingsCount,
                GuidesCreated = guidesCount,
                ForumTopics = forumTopicsCount,
                BlogPosts = blogPostsCount,
                CommentsCount = commentsCount,
                LikesReceived = likesReceived,
                DislikesReceived = dislikesReceived,
                JoinDate = user.CreatedDate,
                LastActivity = user.LastLoginDate
            };
        }

        public async Task<IEnumerable<UserActivityDto>> GetUserActivityAsync(int userId)
        {
            var activities = new List<UserActivityDto>();

            try
            {
                // Get recent game ratings
                var gameRatings = await _unitOfWork.GameRatings.GetAllAsync();
                var userGameRatings = gameRatings.Where(gr => gr.UserId == userId)
                    .OrderByDescending(gr => gr.CreatedDate).Take(5);
                
                foreach (var rating in userGameRatings)
                {
                    try
                    {
                        var game = await _unitOfWork.Games.GetByIdAsync(rating.GameId);
                        activities.Add(new UserActivityDto
                        {
                            Id = $"game_rating_{rating.Id}",
                            Type = "game_rated",
                            Title = $"{game?.Name ?? "Bilinmeyen Oyun"} oyununu puanladı",
                            Date = rating.CreatedDate,
                            Rating = rating.Rating,
                            GameId = rating.GameId,
                            GameName = game?.Name
                        });
                    }
                    catch
                    {
                        // Skip this activity if game fetch fails
                    }
                }

                // Get recent guides
                var guides = await _unitOfWork.Guides.GetAllAsync();
                var userGuides = guides.Where(g => g.UserId == userId)
                    .OrderByDescending(g => g.CreatedDate).Take(5);
                
                foreach (var guide in userGuides)
                {
                    activities.Add(new UserActivityDto
                    {
                        Id = $"guide_{guide.Id}",
                        Type = "guide_created",
                        Title = $"'{guide.Title}' kılavuzunu oluşturdu",
                        Date = guide.CreatedDate,
                        Url = $"/guides/{guide.Id}"
                    });
                }
            }
            catch
            {
                // Return empty list if fetching fails
            }

            return activities.OrderByDescending(a => a.Date).Take(20);
        }

        public async Task<IEnumerable<GameRatingDto>> GetUserGameRatingsAsync(int userId)
        {
            var result = new List<GameRatingDto>();
            
            try
            {
                var gameRatings = await _unitOfWork.GameRatings.GetAllAsync();
                var userGameRatings = gameRatings.Where(gr => gr.UserId == userId);

                foreach (var rating in userGameRatings)
                {
                    try
                    {
                        var game = await _unitOfWork.Games.GetByIdAsync(rating.GameId);
                        result.Add(new GameRatingDto
                        {
                            Id = rating.Id,
                            UserId = rating.UserId,
                            GameId = rating.GameId,
                            Game = game != null ? _mapper.Map<GameDto>(game) : null,
                            Rating = rating.Rating,
                            Review = rating.Review,
                            CreatedDate = rating.CreatedDate,
                            UpdatedDate = rating.UpdatedDate
                        });
                    }
                    catch
                    {
                        // Skip this rating if game fetch fails
                        continue;
                    }
                }
            }
            catch
            {
                // Return empty list if fetching fails
            }

            return result.OrderByDescending(r => r.CreatedDate);
        }

        public async Task<IEnumerable<ForumTopicDto>> GetUserForumPostsAsync(int userId)
        {
            try
            {
                var forumTopics = await _unitOfWork.ForumTopics.FindAsync(ft => ft.UserId == userId);
                var result = new List<ForumTopicDto>();
                
                foreach (var topic in forumTopics.OrderByDescending(t => t.CreatedDate))
                {
                    var topicDto = _mapper.Map<ForumTopicDto>(topic);
                    
                    // Manually fetch and set user information
                    var user = await _unitOfWork.Users.GetByIdAsync(topic.UserId);
                    if (user != null)
                    {
                        topicDto.User = _mapper.Map<UserDto>(user);
                    }
                    
                    // Manually fetch and set category information
                    if (topic.ForumCategoryId > 0)
                    {
                        var category = await _unitOfWork.ForumCategories.GetByIdAsync(topic.ForumCategoryId);
                        if (category != null)
                        {
                            topicDto.ForumCategory = _mapper.Map<ForumCategoryDto>(category);
                        }
                    }
                    
                    // Manually fetch and set game information
                    if (topic.GameId.HasValue && topic.GameId.Value > 0)
                    {
                        var game = await _unitOfWork.Games.GetByIdAsync(topic.GameId.Value);
                        if (game != null)
                        {
                            topicDto.Game = _mapper.Map<GameDto>(game);
                        }
                    }
                    
                    result.Add(topicDto);
                }
                
                return result;
            }
            catch (Exception ex)
            {
                // Log error but don't break the application
                Console.WriteLine($"Error getting forum posts for user {userId}: {ex.Message}");
                return new List<ForumTopicDto>();
            }
        }

        public async Task<IEnumerable<BlogPostDto>> GetUserBlogsAsync(int userId)
        {
            try
            {
                var blogPosts = await _unitOfWork.BlogPosts.FindAsync(bp => bp.UserId == userId);
                var result = new List<BlogPostDto>();
                
                foreach (var blog in blogPosts.OrderByDescending(b => b.CreatedDate))
                {
                    var blogDto = _mapper.Map<BlogPostDto>(blog);
                    
                    // Manually fetch and set user information
                    var user = await _unitOfWork.Users.GetByIdAsync(blog.UserId);
                    if (user != null)
                    {
                        blogDto.User = _mapper.Map<UserDto>(user);
                    }
                    
                    // Manually fetch and set category information
                    if (blog.CategoryId.HasValue && blog.CategoryId.Value > 0)
                    {
                        var category = await _unitOfWork.BlogCategories.GetByIdAsync(blog.CategoryId.Value);
                        if (category != null)
                        {
                            blogDto.Category = _mapper.Map<BlogCategoryDto>(category);
                        }
                    }
                    
                    // Manually fetch and set game information
                    if (blog.GameId.HasValue && blog.GameId.Value > 0)
                    {
                        var game = await _unitOfWork.Games.GetByIdAsync(blog.GameId.Value);
                        if (game != null)
                        {
                            blogDto.Game = _mapper.Map<GameDto>(game);
                        }
                    }
                    
                    result.Add(blogDto);
                }
                
                return result;
            }
            catch (Exception ex)
            {
                // Log error but don't break the application
                Console.WriteLine($"Error getting blog posts for user {userId}: {ex.Message}");
                return new List<BlogPostDto>();
            }
        }

        public async Task<IEnumerable<GuideDto>> GetUserGuidesAsync(int userId)
        {
            try
            {
                var guides = await _unitOfWork.Guides.FindAsync(g => g.UserId == userId);
                var result = new List<GuideDto>();
                
                foreach (var guide in guides.OrderByDescending(g => g.CreatedDate))
                {
                    var guideDto = _mapper.Map<GuideDto>(guide);
                    
                    // Manually fetch and set user information
                    var user = await _unitOfWork.Users.GetByIdAsync(guide.UserId);
                    Console.WriteLine($"DEBUG: Guide {guide.Id} has UserId {guide.UserId}, User found: {user != null}");
                    if (user != null)
                    {
                        Console.WriteLine($"DEBUG: User found - ID: {user.Id}, Username: {user.Username}");
                        guideDto.User = _mapper.Map<UserDto>(user);
                        Console.WriteLine($"DEBUG: UserDto mapped - ID: {guideDto.User?.Id}, Username: {guideDto.User?.Username}");
                    }
                    
                    // Manually fetch and set category information
                    if (guide.GuideCategoryId.HasValue && guide.GuideCategoryId.Value > 0)
                    {
                        var category = await _unitOfWork.GuideCategories.GetByIdAsync(guide.GuideCategoryId.Value);
                        if (category != null)
                        {
                            guideDto.GuideCategory = _mapper.Map<GuideCategoryDto>(category);
                        }
                    }
                    
                    // Manually fetch and set game information
                    if (guide.GameId.HasValue && guide.GameId.Value > 0)
                    {
                        var game = await _unitOfWork.Games.GetByIdAsync(guide.GameId.Value);
                        if (game != null)
                        {
                            guideDto.Game = _mapper.Map<GameDto>(game);
                        }
                    }
                    
                    result.Add(guideDto);
                }
                
                return result;
            }
            catch (Exception ex)
            {
                // Log error but don't break the application
                Console.WriteLine($"Error getting guides for user {userId}: {ex.Message}");
                return new List<GuideDto>();
            }
        }

        public async Task<IEnumerable<UserGameStatusDto>> GetUserGameStatusesAsync(int userId)
        {
            try
            {
                var gameStatuses = await _unitOfWork.UserGameStatuses.FindAsync(ugs => ugs.UserId == userId);
                var result = new List<UserGameStatusDto>();
                
                foreach (var status in gameStatuses.OrderByDescending(ugs => ugs.UpdatedDate))
                {
                    var statusDto = _mapper.Map<UserGameStatusDto>(status);
                    
                    // Manually fetch and set game information
                    if (status.GameId > 0)
                    {
                        var game = await _unitOfWork.Games.GetByIdAsync(status.GameId);
                        if (game != null)
                        {
                            statusDto.Game = _mapper.Map<GameDto>(game);
                        }
                    }
                    
                    result.Add(statusDto);
                }
                
                return result;
            }
            catch (Exception ex)
            {
                // Log error but don't break the application
                Console.WriteLine($"Error getting game statuses for user {userId}: {ex.Message}");
                return new List<UserGameStatusDto>();
            }
        }

        public async Task SendEmailVerificationAsync(int userId)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException("Kullanıcı bulunamadı");
            }

            if (user.IsEmailVerified)
            {
                throw new InvalidOperationException("Email adresi zaten doğrulanmış");
            }

            // Generate verification token
            var token = Guid.NewGuid().ToString();
            var expiryDate = DateTime.UtcNow.AddHours(24); // 24 saat geçerli

            // Update user with verification token
            user.EmailVerificationToken = token;
            user.EmailVerificationTokenExpiry = expiryDate;

            await _unitOfWork.Users.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync();

            // Send verification email
            await _emailService.SendEmailVerificationAsync(user.Email, user.Username, token);
        }

        public async Task VerifyEmailWithTokenAsync(string token)
        {
            if (string.IsNullOrEmpty(token))
            {
                throw new InvalidOperationException("Geçersiz doğrulama tokeni");
            }

            var user = await _unitOfWork.Users.FirstOrDefaultAsync(u => u.EmailVerificationToken == token);
            if (user == null)
            {
                throw new InvalidOperationException("Geçersiz doğrulama tokeni");
            }

            if (user.EmailVerificationTokenExpiry == null || user.EmailVerificationTokenExpiry < DateTime.UtcNow)
            {
                throw new InvalidOperationException("Doğrulama tokeni süresi dolmuş. Yeni bir doğrulama emaili talep edin");
            }

            if (user.IsEmailVerified)
            {
                throw new InvalidOperationException("Email adresi zaten doğrulanmış");
            }

            // Verify email
            user.IsEmailVerified = true;
            user.EmailVerificationToken = null;
            user.EmailVerificationTokenExpiry = null;

            await _unitOfWork.Users.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync();
        }

        // Admin Management Methods
        public async Task<UserDto> ToggleUserStatusAsync(int userId)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException("Kullanıcı bulunamadı");

            user.IsActive = !user.IsActive;
            await _unitOfWork.Users.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<UserDto>(user);
        }

        public async Task<bool> DeleteUserAsync(int userId)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
                return false;

            await _unitOfWork.Users.DeleteAsync(user);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<UserDto?> UpdateUserRoleAsync(int userId, DomainLayer.Enums.UserRole role)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
                return null;

            user.Role = role;
            await _unitOfWork.Users.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<UserDto>(user);
        }
    }
}