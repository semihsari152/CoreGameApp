namespace ApplicationLayer.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string htmlContent);
        Task SendPasswordResetEmailAsync(string email, string resetCode, string username);
        Task SendEmailVerificationAsync(string email, string username, string verificationToken);
    }
}