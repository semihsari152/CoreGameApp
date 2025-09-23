using ApplicationLayer.DTOs;
using FluentValidation;
using DomainLayer.Enums;

namespace ApplicationLayer.Validators
{
    public class CreateUserGameStatusValidator : AbstractValidator<CreateUserGameStatusDto>
    {
        public CreateUserGameStatusValidator()
        {
            RuleFor(x => x.GameId)
                .GreaterThan(0)
                .WithMessage("Geçerli bir oyun seçilmelidir.");

            RuleFor(x => x.Status)
                .IsInEnum()
                .WithMessage("Geçerli bir oyun durumu seçilmelidir.");

            RuleFor(x => x.Notes)
                .MaximumLength(500)
                .WithMessage("Notlar en fazla 500 karakter olabilir.")
                .When(x => !string.IsNullOrEmpty(x.Notes));
        }
    }

    public class UpdateUserGameStatusValidator : AbstractValidator<UpdateUserGameStatusDto>
    {
        public UpdateUserGameStatusValidator()
        {
            RuleFor(x => x.Status)
                .IsInEnum()
                .WithMessage("Geçerli bir oyun durumu seçilmelidir.");

            RuleFor(x => x.Notes)
                .MaximumLength(500)
                .WithMessage("Notlar en fazla 500 karakter olabilir.")
                .When(x => !string.IsNullOrEmpty(x.Notes));
        }
    }
}