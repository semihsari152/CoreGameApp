namespace DomainLayer.Enums
{
    public enum GuideBlockType
    {
        Text = 1,           // Markdown text content
        Image = 2,          // Image with caption
        Video = 3,          // Video embed (YouTube, etc.)
        Code = 4,           // Code snippet with syntax highlighting
        List = 5,           // Step-by-step numbered/bulleted list
        Quote = 6,          // Important note/warning block
        Divider = 7,        // Section separator
        Gallery = 8,        // Multiple images in gallery format
        Link = 9,           // External link with preview
        Table = 10          // Data table
    }
}