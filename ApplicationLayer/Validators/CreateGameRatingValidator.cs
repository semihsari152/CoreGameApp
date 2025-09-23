using ApplicationLayer.DTOs;
using FluentValidation;

namespace ApplicationLayer.Validators
{
    public class CreateGameRatingValidator : AbstractValidator<CreateGameRatingDto>
    {
        public CreateGameRatingValidator()
        {
            RuleFor(x => x.UserId)
                .GreaterThan(0)
                .WithMessage("Geçerli bir kullanıcı gereklidir.");

            RuleFor(x => x.GameId)
                .GreaterThan(0)
                .WithMessage("Geçerli bir oyun seçilmelidir.");

            RuleFor(x => x.Rating)
                .InclusiveBetween(1, 5)
                .WithMessage("Puan 1 ile 5 arasında olmalıdır.");

            RuleFor(x => x.Review)
                .MaximumLength(1000)
                .WithMessage("İnceleme en fazla 1000 karakter olabilir.")
                .When(x => !string.IsNullOrEmpty(x.Review));
        }
    }

    public class UpdateGameRatingValidator : AbstractValidator<UpdateGameRatingDto>
    {
        public UpdateGameRatingValidator()
        {
            RuleFor(x => x.Rating)
                .InclusiveBetween(1, 5)
                .WithMessage("Puan 1 ile 5 arasında olmalıdır.")
                .When(x => x.Rating.HasValue);

            RuleFor(x => x.Review)
                .MaximumLength(1000)
                .WithMessage("İnceleme en fazla 1000 karakter olabilir.")
                .When(x => !string.IsNullOrEmpty(x.Review));
        }
    }
}