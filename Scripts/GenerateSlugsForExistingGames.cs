using Microsoft.EntityFrameworkCore;
using InfrastructureLayer.Data;
using ApplicationLayer.Utils;

namespace Scripts
{
    public class GenerateSlugsForExistingGames
    {
        public static async Task Main(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
            optionsBuilder.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=CoreGameApp;Trusted_Connection=true;MultipleActiveResultSets=true");

            using var context = new AppDbContext(optionsBuilder.Options);

            Console.WriteLine("Mevcut oyunlar için slug oluşturuluyor...");

            var gamesWithoutSlug = await context.Games
                .Where(g => g.Slug == null || g.Slug == string.Empty)
                .ToListAsync();

            Console.WriteLine($"{gamesWithoutSlug.Count} oyun için slug oluşturulacak.");

            var slugCounts = new Dictionary<string, int>();

            foreach (var game in gamesWithoutSlug)
            {
                var baseSlug = SlugGenerator.GenerateSlug(game.Name);
                
                // Handle duplicates
                var uniqueSlug = baseSlug;
                var counter = 1;
                
                while (slugCounts.ContainsKey(uniqueSlug) || 
                       await context.Games.AnyAsync(g => g.Slug == uniqueSlug && g.Id != game.Id))
                {
                    uniqueSlug = $"{baseSlug}-{counter}";
                    counter++;
                }
                
                slugCounts[uniqueSlug] = 1;
                game.Slug = uniqueSlug;
                
                Console.WriteLine($"Game: {game.Name} -> Slug: {uniqueSlug}");
            }

            await context.SaveChangesAsync();
            Console.WriteLine($"{gamesWithoutSlug.Count} oyun için slug oluşturuldu ve kaydedildi.");
        }
    }
}