using ApplicationLayer.DTOs;
using FluentValidation;
using DomainLayer.Enums;

namespace ApplicationLayer.Validators
{
    public class CreateLikeValidator : AbstractValidator<CreateLikeDto>
    {
        public CreateLikeValidator()
        {
            RuleFor(x => x.UserId)
                .GreaterThan(0)
                .WithMessage("Geçerli bir kullanıcı gereklidir.");

            RuleFor(x => x.TargetEntityId)
                .GreaterThan(0)
                .WithMessage("Geçerli bir hedef entity gereklidir.");

            RuleFor(x => x.LikableType)
                .IsInEnum()
                .WithMessage("Geçerli bir likable type seçilmelidir.");
        }
    }
}