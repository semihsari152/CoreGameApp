using ApplicationLayer.Services;
using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;

namespace InfrastructureLayer.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly SmtpClient _smtpClient;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;

            var senderEmail = _configuration["EmailSettings:SenderEmail"];
            var senderPassword = _configuration["EmailSettings:SenderPassword"];

            if (string.IsNullOrEmpty(senderEmail) || string.IsNullOrEmpty(senderPassword))
            {
                throw new InvalidOperationException("Email settings are not configured properly. Please check SenderEmail and SenderPassword in appsettings.json");
            }

            // Gmail SMTP ayarları
            _smtpClient = new SmtpClient("smtp.gmail.com", 587)
            {
                EnableSsl = true,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(senderEmail, senderPassword)
            };
        }

        public async Task SendEmailAsync(string to, string subject, string htmlContent)
        {
            try
            {
                var senderEmail = _configuration["EmailSettings:SenderEmail"];
                if (string.IsNullOrEmpty(senderEmail))
                {
                    throw new InvalidOperationException("SenderEmail is not configured in appsettings.json");
                }

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(senderEmail, "CoreGame"),
                    Subject = subject,
                    Body = htmlContent,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(to);

                Console.WriteLine($"Attempting to send email to: {to}");
                Console.WriteLine($"Using sender email: {senderEmail}");
                
                await _smtpClient.SendMailAsync(mailMessage);
                
                Console.WriteLine("Email sent successfully!");
            }
            catch (SmtpException smtpEx)
            {
                Console.WriteLine($"SMTP Error: {smtpEx.Message}");
                Console.WriteLine($"Status Code: {smtpEx.StatusCode}");
                
                if (smtpEx.Message.Contains("Authentication Required") || smtpEx.Message.Contains("5.7.0"))
                {
                    throw new Exception("Gmail kimlik doğrulama hatası! Lütfen şunları kontrol edin:\n" +
                                     "1. Gmail hesabınızda 2-Step Verification açık olmalı\n" +
                                     "2. App Password oluşturmalı ve bunu SenderPassword olarak kullanmalısınız\n" +
                                     "3. Normal Gmail şifrenizi değil, App Password'u kullanmalısınız");
                }
                
                throw new Exception($"Email gönderilirken SMTP hatası: {smtpEx.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Email sending failed: {ex.Message}");
                throw new Exception($"Email gönderilirken hata oluştu: {ex.Message}");
            }
        }

        public async Task SendPasswordResetEmailAsync(string email, string resetCode, string username)
        {
            var subject = "CoreGame - Şifre Sıfırlama Kodu";
            var body = $@"
                <html>
                <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                    <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>
                        <h2 style='color: #4f46e5; text-align: center;'>CoreGame</h2>
                        <h3>Merhaba {username},</h3>
                        <p>Şifre sıfırlama talebiniz alınmıştır. Yeni şifrenizi belirlemek için aşağıdaki doğrulama kodunu kullanın:</p>
                        
                        <div style='text-align: center; margin: 30px 0;'>
                            <span style='font-size: 32px; font-weight: bold; color: #4f46e5; letter-spacing: 10px; padding: 20px; border: 2px dashed #4f46e5; background-color: #f8fafc;'>{resetCode}</span>
                        </div>
                        
                        <p style='color: #dc2626;'><strong>Önemli:</strong> Bu kod 15 dakika içinde kullanılmazsa geçerliliğini yitirecektir.</p>
                        
                        <p>Eğer şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
                        
                        <hr style='margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;'>
                        <p style='text-align: center; color: #6b7280; font-size: 12px;'>
                            Bu e-posta CoreGame tarafından otomatik olarak gönderilmiştir.<br>
                            Lütfen bu e-postayı yanıtlamayın.
                        </p>
                    </div>
                </body>
                </html>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendEmailVerificationAsync(string email, string username, string verificationToken)
        {
            var baseUrl = _configuration["EmailSettings:BaseUrl"] ?? "http://localhost:3001";
            var verificationUrl = $"{baseUrl}/verify-email?token={verificationToken}";

            var subject = "CoreGame - Email Adresinizi Onaylayın";
            var body = $@"
                <html>
                <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                    <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>
                        <div style='text-align: center; margin-bottom: 30px;'>
                            <h2 style='color: #3b82f6; font-size: 28px; margin: 0;'>CoreGame</h2>
                            <p style='color: #6b7280; font-size: 16px; margin: 5px 0;'>Gaming Community Platform</p>
                        </div>
                        
                        <div style='background: #f8fafc; padding: 30px; border-radius: 10px; border-left: 4px solid #3b82f6;'>
                            <h3 style='color: #1f2937; font-size: 24px; margin-bottom: 20px;'>Merhaba {username}!</h3>
                            
                            <p style='color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;'>
                                CoreGame'e hoş geldin! Email adresini onaylamak için aşağıdaki butona tıkla:
                            </p>
                            
                            <div style='text-align: center; margin: 30px 0;'>
                                <a href='{verificationUrl}' 
                                   style='display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;'>
                                    Email Adresimi Onayla
                                </a>
                            </div>
                            
                            <p style='color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 20px;'>
                                Bu link 24 saat geçerlidir. Eğer bu işlemi sen yapmadıysan, bu emaili görmezden gel.
                            </p>
                            
                            <p style='color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 15px;'>
                                Buton çalışmıyorsa bu linki kopyalayıp tarayıcına yapıştır:<br>
                                <span style='color: #3b82f6; word-break: break-all;'>{verificationUrl}</span>
                            </p>
                        </div>
                        
                        <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;'>
                            <p style='color: #9ca3af; font-size: 12px; margin: 0;'>
                                © 2025 CoreGame. Tüm hakları saklıdır.
                            </p>
                        </div>
                    </div>
                </body>
                </html>";

            await SendEmailAsync(email, subject, body);
        }

        public void Dispose()
        {
            _smtpClient?.Dispose();
        }
    }
}