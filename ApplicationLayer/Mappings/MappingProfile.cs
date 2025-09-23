using AutoMapper;
using ApplicationLayer.DTOs;
using DomainLayer.Entities;

namespace ApplicationLayer.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // User mappings
            CreateMap<User, UserDto>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedDate))
                .ForMember(dest => dest.LastLoginAt, opt => opt.MapFrom(src => src.LastLoginDate));
            CreateMap<CreateUserDto, User>();
            CreateMap<UpdateUserDto, User>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Game mappings
            CreateMap<Game, GameDto>()
                .ForMember(dest => dest.Platforms, opt => opt.Ignore())
                .ForMember(dest => dest.Genres, opt => opt.Ignore())
                .ForMember(dest => dest.Tags, opt => opt.Ignore())
                .ForMember(dest => dest.CoverUrl, opt => opt.MapFrom(src => src.CoverImageUrl));
            
            CreateMap<CreateGameDto, Game>()
                .ForMember(dest => dest.GamePlatforms, opt => opt.Ignore())
                .ForMember(dest => dest.GameGenres, opt => opt.Ignore());
            CreateMap<UpdateGameDto, Game>()
                .ForMember(dest => dest.GamePlatforms, opt => opt.Ignore())
                .ForMember(dest => dest.GameGenres, opt => opt.Ignore())
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Comment mappings
            CreateMap<Comment, CommentDto>()
                .ForMember(dest => dest.Username, opt => opt.MapFrom(src => src.User.Username))
                .ForMember(dest => dest.UserAvatarUrl, opt => opt.MapFrom(src => src.User.AvatarUrl))
                .ForMember(dest => dest.ChildComments, opt => opt.MapFrom(src => src.ChildComments.Where(c => !c.IsDeleted)));
            
            CreateMap<CreateCommentDto, Comment>()
                .ForMember(dest => dest.TargetEntityId, opt => opt.MapFrom(src => src.CommentableEntityId));
            CreateMap<UpdateCommentDto, Comment>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Guide mappings
            CreateMap<Guide, GuideDto>()
                .ForMember(dest => dest.Tags, opt => opt.MapFrom(src => src.GuideTags.Select(gt => gt.Tag.Name).ToList()));
            CreateMap<CreateGuideDto, Guide>()
                .ForMember(dest => dest.GuideTags, opt => opt.Ignore())
                .ForMember(dest => dest.GuideBlocks, opt => opt.Ignore());
            CreateMap<UpdateGuideDto, Guide>()
                .ForMember(dest => dest.GuideTags, opt => opt.Ignore())
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // GuideCategory mappings
            CreateMap<GuideCategory, GuideCategoryDto>();

            // GuideBlock mappings
            CreateMap<GuideBlock, ApplicationLayer.DTOs.Guide.GuideBlockDto>();
            CreateMap<ApplicationLayer.DTOs.Guide.CreateGuideBlockDto, GuideBlock>();
            CreateMap<ApplicationLayer.DTOs.Guide.UpdateGuideBlockDto, GuideBlock>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Forum Topic mappings
            CreateMap<ForumTopic, ForumTopicDto>();
            CreateMap<CreateForumTopicDto, ForumTopic>();
            CreateMap<UpdateForumTopicDto, ForumTopic>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Blog Post mappings
            CreateMap<BlogPost, BlogPostDto>()
                .ForMember(dest => dest.Tags, opt => opt.MapFrom(src => src.BlogPostTags.Select(bt => bt.Tag.Name).ToList()))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedDate))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => src.UpdatedDate))
                .ForMember(dest => dest.Author, opt => opt.MapFrom(src => src.User));
            CreateMap<CreateBlogPostDto, BlogPost>();
            CreateMap<UpdateBlogPostDto, BlogPost>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Blog Category mappings
            CreateMap<BlogCategory, BlogCategoryDto>();

            // Like mappings
            CreateMap<Like, LikeDto>();
            CreateMap<CreateLikeDto, Like>();

            // User Game Status mappings
            CreateMap<UserGameStatus, UserGameStatusDto>();
            CreateMap<CreateUserGameStatusDto, UserGameStatus>();
            CreateMap<UpdateUserGameStatusDto, UserGameStatus>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Game Rating mappings
            CreateMap<GameRating, GameRatingDto>();
            CreateMap<CreateGameRatingDto, GameRating>();
            CreateMap<UpdateGameRatingDto, GameRating>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Genre mappings
            CreateMap<Genre, GenreDto>();
            CreateMap<CreateGenreDto, Genre>();
            CreateMap<UpdateGenreDto, Genre>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Tag mappings
            CreateMap<Tag, TagDto>();
            CreateMap<CreateTagDto, Tag>();
            CreateMap<UpdateTagDto, Tag>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Forum Category mappings
            CreateMap<ForumCategory, ForumCategoryDto>();
            CreateMap<CreateForumCategoryDto, ForumCategory>();
            CreateMap<UpdateForumCategoryDto, ForumCategory>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Notification mappings
            CreateMap<Notification, NotificationDto>();
            CreateMap<CreateNotificationDto, Notification>();

            // Report mappings
            CreateMap<Report, ReportDto>();
            CreateMap<CreateReportDto, Report>();

            // Favorite mappings
            CreateMap<Favorite, FavoriteDto>();
            CreateMap<CreateFavoriteDto, Favorite>();

            // GameSeries mappings
            CreateMap<GameSeries, GameSeriesDto>()
                .ForMember(dest => dest.GameCount, opt => opt.Ignore()); // Will be set manually in service
            CreateMap<CreateGameSeriesDto, GameSeries>();
            CreateMap<UpdateGameSeriesDto, GameSeries>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}