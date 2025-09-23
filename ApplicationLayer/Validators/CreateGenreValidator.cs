using ApplicationLayer.DTOs;
using FluentValidation;

namespace ApplicationLayer.Validators
{
    public class CreateGenreValidator : AbstractValidator<CreateGenreDto>
    {
        public CreateGenreValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty()
                .WithMessage("Tür adı gereklidir.")
                .MaximumLength(100)
                .WithMessage("Tür adı en fazla 100 karakter olabilir.");

            RuleFor(x => x.Description)
                .MaximumLength(500)
                .WithMessage("Açıklama en fazla 500 karakter olabilir.")
                .When(x => !string.IsNullOrEmpty(x.Description));
        }
    }

    public class UpdateGenreValidator : AbstractValidator<UpdateGenreDto>
    {
        public UpdateGenreValidator()
        {
            RuleFor(x => x.Name)
                .MaximumLength(100)
                .WithMessage("Tür adı en fazla 100 karakter olabilir.")
                .When(x => !string.IsNullOrEmpty(x.Name));

            RuleFor(x => x.Description)
                .MaximumLength(500)
                .WithMessage("Açıklama en fazla 500 karakter olabilir.")
                .When(x => !string.IsNullOrEmpty(x.Description));
        }
    }
}