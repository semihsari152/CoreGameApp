using System.Net;
using System.Text.Json;
using FluentValidation;

namespace APILayer.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occurred");
                await HandleExceptionAsync(context, ex);
            }
        }

        private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            
            var response = new ErrorResponse();

            switch (exception)
            {
                case ValidationException validationException:
                    response.Message = "Validation failed";
                    response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.Errors = validationException.Errors.Select(e => e.ErrorMessage).ToList();
                    break;
                    
                case ArgumentException argumentException:
                    response.Message = argumentException.Message;
                    response.StatusCode = (int)HttpStatusCode.BadRequest;
                    break;
                    
                case InvalidOperationException invalidOperationException:
                    response.Message = invalidOperationException.Message;
                    response.StatusCode = (int)HttpStatusCode.BadRequest;
                    break;
                    
                case UnauthorizedAccessException:
                    response.Message = "Unauthorized access";
                    response.StatusCode = (int)HttpStatusCode.Unauthorized;
                    break;
                    
                case KeyNotFoundException:
                    response.Message = "Resource not found";
                    response.StatusCode = (int)HttpStatusCode.NotFound;
                    break;
                    
                default:
                    response.Message = "An internal server error occurred";
                    response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    break;
            }

            context.Response.StatusCode = response.StatusCode;
            
            var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
            
            await context.Response.WriteAsync(jsonResponse);
        }
    }

    public class ErrorResponse
    {
        public string Message { get; set; } = string.Empty;
        public int StatusCode { get; set; }
        public List<string>? Errors { get; set; }
        public string? TraceId { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}