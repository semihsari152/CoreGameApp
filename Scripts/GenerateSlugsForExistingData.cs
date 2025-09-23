using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using InfrastructureLayer.Data;
using ApplicationLayer.Utils;

namespace Scripts
{
    public class GenerateSlugsForExistingData
    {
        public static async Task Main(string[] args)
        {
            var host = CreateHostBuilder(args).Build();
            
            using var scope = host.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            
            await GenerateSlugs(context);
            
            Console.WriteLine("Slug generation completed!");
        }

        private static async Task GenerateSlugs(AppDbContext context)
        {
            Console.WriteLine("Starting slug generation for existing data...");

            // Generate slugs for BlogPosts
            var blogPosts = await context.BlogPosts
                .Where(b => string.IsNullOrEmpty(b.Slug))
                .ToListAsync();

            Console.WriteLine($"Found {blogPosts.Count} blog posts without slugs");

            foreach (var post in blogPosts)
            {
                var baseSlug = SlugGenerator.GenerateSlug(post.Title);
                var uniqueSlug = SlugGenerator.EnsureUnique(baseSlug, slug => 
                    context.BlogPosts.Any(b => b.Slug == slug));
                
                post.Slug = uniqueSlug;
                Console.WriteLine($"Generated slug for blog post '{post.Title}': {uniqueSlug}");
            }

            // Generate slugs for ForumTopics
            var forumTopics = await context.ForumTopics
                .Where(ft => string.IsNullOrEmpty(ft.Slug))
                .ToListAsync();

            Console.WriteLine($"Found {forumTopics.Count} forum topics without slugs");

            foreach (var topic in forumTopics)
            {
                var baseSlug = SlugGenerator.GenerateSlug(topic.Title);
                var uniqueSlug = SlugGenerator.EnsureUnique(baseSlug, slug => 
                    context.ForumTopics.Any(ft => ft.Slug == slug));
                
                topic.Slug = uniqueSlug;
                Console.WriteLine($"Generated slug for forum topic '{topic.Title}': {uniqueSlug}");
            }

            // Generate slugs for Guides
            var guides = await context.Guides
                .Where(g => string.IsNullOrEmpty(g.Slug))
                .ToListAsync();

            Console.WriteLine($"Found {guides.Count} guides without slugs");

            foreach (var guide in guides)
            {
                var baseSlug = SlugGenerator.GenerateSlug(guide.Title);
                var uniqueSlug = SlugGenerator.EnsureUnique(baseSlug, slug => 
                    context.Guides.Any(g => g.Slug == slug));
                
                guide.Slug = uniqueSlug;
                Console.WriteLine($"Generated slug for guide '{guide.Title}': {uniqueSlug}");
            }

            // Save all changes
            await context.SaveChangesAsync();
            Console.WriteLine("All slugs have been generated and saved!");
        }

        private static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureServices((context, services) =>
                {
                    services.AddDbContext<AppDbContext>(options =>
                        options.UseSqlServer(context.Configuration.GetConnectionString("DefaultConnection")));
                });
    }
}