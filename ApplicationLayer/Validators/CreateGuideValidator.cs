using ApplicationLayer.DTOs;
using FluentValidation;

namespace ApplicationLayer.Validators
{
    public class CreateGuideValidator : AbstractValidator<CreateGuideDto>
    {
        public CreateGuideValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty()
                .WithMessage("Başlık gereklidir.")
                .MaximumLength(200)
                .WithMessage("Başlık en fazla 200 karakter olabilir.");

            RuleFor(x => x.GuideBlocks)
                .NotEmpty()
                .WithMessage("Kılavuz en az bir blok içermelidir.");

            RuleFor(x => x.Summary)
                .MaximumLength(500)
                .WithMessage("Özet en fazla 500 karakter olabilir.")
                .When(x => !string.IsNullOrEmpty(x.Summary));

            RuleFor(x => x.GameId)
                .GreaterThan(0)
                .WithMessage("Geçerli bir oyun seçilmelidir.");

            RuleFor(x => x.UserId)
                .GreaterThan(0)
                .WithMessage("Geçerli bir kullanıcı gereklidir.");
        }
    }

    public class UpdateGuideValidator : AbstractValidator<UpdateGuideDto>
    {
        public UpdateGuideValidator()
        {
            RuleFor(x => x.Title)
                .MaximumLength(200)
                .WithMessage("Başlık en fazla 200 karakter olabilir.")
                .When(x => !string.IsNullOrEmpty(x.Title));

            RuleFor(x => x.Summary)
                .MaximumLength(500)
                .WithMessage("Özet en fazla 500 karakter olabilir.")
                .When(x => !string.IsNullOrEmpty(x.Summary));
        }
    }
}