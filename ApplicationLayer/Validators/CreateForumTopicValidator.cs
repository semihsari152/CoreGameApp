using ApplicationLayer.DTOs;
using FluentValidation;

namespace ApplicationLayer.Validators
{
    public class CreateForumTopicValidator : AbstractValidator<CreateForumTopicDto>
    {
        public CreateForumTopicValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty()
                .WithMessage("Başlık gereklidir.")
                .MaximumLength(200)
                .WithMessage("Başlık en fazla 200 karakter olabilir.");

            RuleFor(x => x.Content)
                .NotEmpty()
                .WithMessage("İçerik gereklidir.")
                .MinimumLength(10)
                .WithMessage("İçerik en az 10 karakter olmalıdır.");

            RuleFor(x => x.UserId)
                .GreaterThan(0)
                .WithMessage("Geçerli bir kullanıcı gereklidir.");

            RuleFor(x => x.ForumCategoryId)
                .GreaterThan(0)
                .WithMessage("Geçerli bir forum kategorisi seçilmelidir.");
        }
    }

    public class UpdateForumTopicValidator : AbstractValidator<UpdateForumTopicDto>
    {
        public UpdateForumTopicValidator()
        {
            RuleFor(x => x.Title)
                .MaximumLength(200)
                .WithMessage("Başlık en fazla 200 karakter olabilir.")
                .When(x => !string.IsNullOrEmpty(x.Title));

            RuleFor(x => x.Content)
                .MinimumLength(10)
                .WithMessage("İçerik en az 10 karakter olmalıdır.")
                .When(x => !string.IsNullOrEmpty(x.Content));
        }
    }
}