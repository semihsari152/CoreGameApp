using InfrastructureLayer.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace InfrastructureLayer.Attributes
{
    public class RequirePermissionAttribute : Attribute, IAsyncActionFilter
    {
        private readonly string _permissionKey;

        public RequirePermissionAttribute(string permissionKey)
        {
            _permissionKey = permissionKey;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var adminPermissionService = context.HttpContext.RequestServices
                .GetService(typeof(AdminPermissionService)) as AdminPermissionService;

            if (adminPermissionService == null)
            {
                context.Result = new StatusCodeResult(500);
                return;
            }

            var userIdClaim = context.HttpContext.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var hasPermission = await adminPermissionService.HasPermissionAsync(userId, _permissionKey);
            if (!hasPermission)
            {
                context.Result = new ForbidResult($"Permission '{_permissionKey}' required");
                return;
            }

            await next();
        }
    }
}