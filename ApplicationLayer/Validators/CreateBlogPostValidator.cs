using ApplicationLayer.DTOs;
using FluentValidation;

namespace ApplicationLayer.Validators
{
    public class CreateBlogPostValidator : AbstractValidator<CreateBlogPostDto>
    {
        public CreateBlogPostValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty()
                .WithMessage("Başlık gereklidir.")
                .MaximumLength(200)
                .WithMessage("Başlık en fazla 200 karakter olabilir.");

            RuleFor(x => x.Content)
                .NotEmpty()
                .WithMessage("İçerik gereklidir.")
                .MinimumLength(100)
                .WithMessage("İçerik en az 100 karakter olmalıdır.");

            RuleFor(x => x.Summary)
                .MaximumLength(500)
                .WithMessage("Özet en fazla 500 karakter olabilir.")
                .When(x => !string.IsNullOrEmpty(x.Summary));

            RuleFor(x => x.CoverImageUrl)
                .Must(BeValidUrl)
                .WithMessage("Geçerli bir resim URL'si giriniz.")
                .When(x => !string.IsNullOrEmpty(x.CoverImageUrl));

            RuleFor(x => x.CategoryId)
                .GreaterThan(0)
                .WithMessage("Kategori seçimi gereklidir.");

            RuleFor(x => x.Tags)
                .NotEmpty()
                .WithMessage("En az bir etiket eklemelisiniz.");
        }

        private bool BeValidUrl(string? url)
        {
            if (string.IsNullOrEmpty(url)) return false;
            return Uri.TryCreate(url, UriKind.Absolute, out _);
        }
    }

    public class UpdateBlogPostValidator : AbstractValidator<UpdateBlogPostDto>
    {
        public UpdateBlogPostValidator()
        {
            RuleFor(x => x.Title)
                .MaximumLength(200)
                .WithMessage("Başlık en fazla 200 karakter olabilir.")
                .When(x => !string.IsNullOrEmpty(x.Title));

            RuleFor(x => x.Content)
                .MinimumLength(100)
                .WithMessage("İçerik en az 100 karakter olmalıdır.")
                .When(x => !string.IsNullOrEmpty(x.Content));

            RuleFor(x => x.Summary)
                .MaximumLength(500)
                .WithMessage("Özet en fazla 500 karakter olabilir.")
                .When(x => !string.IsNullOrEmpty(x.Summary));

            RuleFor(x => x.CoverImageUrl)
                .Must(BeValidUrl)
                .WithMessage("Geçerli bir resim URL'si giriniz.")
                .When(x => !string.IsNullOrEmpty(x.CoverImageUrl));
        }

        private bool BeValidUrl(string? url)
        {
            if (string.IsNullOrEmpty(url)) return false;
            return Uri.TryCreate(url, UriKind.Absolute, out _);
        }
    }
}