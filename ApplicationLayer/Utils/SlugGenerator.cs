using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace ApplicationLayer.Utils
{
    public static class SlugGenerator
    {
        public static string GenerateSlug(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return string.Empty;

            // Convert to lowercase and remove Turkish characters
            var slug = input.ToLowerInvariant();

            // Turkish character mappings
            var turkishChars = new Dictionary<char, char>
            {
                {'ç', 'c'}, {'ğ', 'g'}, {'ı', 'i'}, {'ö', 'o'}, {'ş', 's'}, {'ü', 'u'},
                {'Ç', 'c'}, {'Ğ', 'g'}, {'İ', 'i'}, {'Ö', 'o'}, {'Ş', 's'}, {'Ü', 'u'}
            };

            // Replace Turkish characters
            var sb = new StringBuilder();
            foreach (var c in slug)
            {
                if (turkishChars.ContainsKey(c))
                    sb.Append(turkishChars[c]);
                else
                    sb.Append(c);
            }
            slug = sb.ToString();

            // Remove diacritics (accents)
            slug = RemoveDiacritics(slug);

            // Replace non-alphanumeric characters with hyphens
            slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
            
            // Replace multiple spaces/hyphens with single hyphen
            slug = Regex.Replace(slug, @"[\s-]+", "-");
            
            // Trim hyphens from start and end
            slug = slug.Trim('-');

            // Limit length to 100 characters
            if (slug.Length > 100)
                slug = slug.Substring(0, 100).TrimEnd('-');

            return slug;
        }

        private static string RemoveDiacritics(string text)
        {
            var normalizedString = text.Normalize(NormalizationForm.FormD);
            var stringBuilder = new StringBuilder();

            foreach (var c in normalizedString)
            {
                var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != UnicodeCategory.NonSpacingMark)
                {
                    stringBuilder.Append(c);
                }
            }

            return stringBuilder.ToString().Normalize(NormalizationForm.FormC);
        }

        public static string EnsureUnique(string baseSlug, Func<string, bool> slugExists)
        {
            var slug = baseSlug;
            var counter = 1;

            while (slugExists(slug))
            {
                slug = $"{baseSlug}-{counter}";
                counter++;
            }

            return slug;
        }
    }
}