using ApplicationLayer.DTOs;
using FluentValidation;

namespace ApplicationLayer.Validators
{
    public class CreateTagValidator : AbstractValidator<CreateTagDto>
    {
        public CreateTagValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty()
                .WithMessage("Etiket adı gereklidir.")
                .MaximumLength(50)
                .WithMessage("Etiket adı en fazla 50 karakter olabilir.");

            RuleFor(x => x.Description)
                .MaximumLength(200)
                .WithMessage("Açıklama en fazla 200 karakter olabilir.")
                .When(x => !string.IsNullOrEmpty(x.Description));
        }
    }

    public class UpdateTagValidator : AbstractValidator<UpdateTagDto>
    {
        public UpdateTagValidator()
        {
            RuleFor(x => x.Name)
                .MaximumLength(50)
                .WithMessage("Etiket adı en fazla 50 karakter olabilir.")
                .When(x => !string.IsNullOrEmpty(x.Name));

            RuleFor(x => x.Description)
                .MaximumLength(200)
                .WithMessage("Açıklama en fazla 200 karakter olabilir.")
                .When(x => !string.IsNullOrEmpty(x.Description));
        }
    }
}