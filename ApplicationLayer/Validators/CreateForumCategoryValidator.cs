using ApplicationLayer.DTOs;
using FluentValidation;

namespace ApplicationLayer.Validators
{
    public class CreateForumCategoryValidator : AbstractValidator<CreateForumCategoryDto>
    {
        public CreateForumCategoryValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty()
                .WithMessage("Forum kategorisi adı gereklidir.")
                .MaximumLength(100)
                .WithMessage("Forum kategorisi adı en fazla 100 karakter olabilir.");

            RuleFor(x => x.Description)
                .MaximumLength(500)
                .WithMessage("Açıklama en fazla 500 karakter olabilir.")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.DisplayOrder)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Görüntüleme sırası 0 veya daha büyük olmalıdır.");
        }
    }

    public class UpdateForumCategoryValidator : AbstractValidator<UpdateForumCategoryDto>
    {
        public UpdateForumCategoryValidator()
        {
            RuleFor(x => x.Name)
                .MaximumLength(100)
                .WithMessage("Forum kategorisi adı en fazla 100 karakter olabilir.")
                .When(x => !string.IsNullOrEmpty(x.Name));

            RuleFor(x => x.Description)
                .MaximumLength(500)
                .WithMessage("Açıklama en fazla 500 karakter olabilir.")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.DisplayOrder)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Görüntüleme sırası 0 veya daha büyük olmalıdır.")
                .When(x => x.DisplayOrder.HasValue);
        }
    }
}