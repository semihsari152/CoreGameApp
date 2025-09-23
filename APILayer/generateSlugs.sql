-- Script to generate basic slugs for existing data
-- This is a simple approach using SQL Server functions

-- First, let's add a helper function to clean up titles for slugs
-- We'll do basic cleanup: lowercase, replace spaces with hyphens, remove special chars

-- Update BlogPosts with basic slugs
UPDATE BlogPosts 
SET Slug = LOWER(
    REPLACE(
        REPLACE(
            REPLACE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(Title, ' ', '-'),
                                'ç', 'c'),
                            'ğ', 'g'),
                        'ı', 'i'),
                    'ö', 'o'),
                'ş', 's'),
            'ü', 'u'),
        '?', ''),
    '!', '')
) + '-' + CAST(Id as VARCHAR(10))
WHERE Slug IS NULL OR Slug = '';

-- Update ForumTopics with basic slugs
UPDATE ForumTopics 
SET Slug = LOWER(
    REPLACE(
        REPLACE(
            REPLACE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(Title, ' ', '-'),
                                'ç', 'c'),
                            'ğ', 'g'),
                        'ı', 'i'),
                    'ö', 'o'),
                'ş', 's'),
            'ü', 'u'),
        '?', ''),
    '!', '')
) + '-' + CAST(Id as VARCHAR(10))
WHERE Slug IS NULL OR Slug = '';

-- Update Guides with basic slugs
UPDATE Guides 
SET Slug = LOWER(
    REPLACE(
        REPLACE(
            REPLACE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(Title, ' ', '-'),
                                'ç', 'c'),
                            'ğ', 'g'),
                        'ı', 'i'),
                    'ö', 'o'),
                'ş', 's'),
            'ü', 'u'),
        '?', ''),
    '!', '')
) + '-' + CAST(Id as VARCHAR(10))
WHERE Slug IS NULL OR Slug = '';

-- Clean up any double hyphens
UPDATE BlogPosts SET Slug = REPLACE(Slug, '--', '-');
UPDATE ForumTopics SET Slug = REPLACE(Slug, '--', '-');
UPDATE Guides SET Slug = REPLACE(Slug, '--', '-');

SELECT 'Slug generation completed!' as Message;