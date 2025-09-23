using FluentValidation;
using ApplicationLayer.DTOs;

namespace ApplicationLayer.Validators
{
    public class CreateCommentValidator : AbstractValidator<CreateCommentDto>
    {
        public CreateCommentValidator()
        {
            RuleFor(x => x.Content)
                .NotEmpty().WithMessage("Yorum içeriği boş olamaz.")
                .Length(1, 1000).WithMessage("Yorum 1-1000 karakter arası olmalıdır.");

            RuleFor(x => x.CommentableType)
                .IsInEnum().WithMessage("Geçersiz yorum tipi.");

            RuleFor(x => x.CommentableEntityId)
                .GreaterThan(0).WithMessage("Hedef varlık ID'si geçersiz.");

            RuleFor(x => x.ParentCommentId)
                .GreaterThan(0).WithMessage("Üst yorum ID'si geçersiz.")
                .When(x => x.ParentCommentId.HasValue);
        }
    }
}