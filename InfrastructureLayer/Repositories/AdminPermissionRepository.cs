using DomainLayer.Entities;
using InfrastructureLayer.Data;
using Microsoft.EntityFrameworkCore;

namespace InfrastructureLayer.Repositories
{
    public class AdminPermissionRepository : Repository<AdminPermission>
    {
        private readonly AppDbContext _context;

        public AdminPermissionRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<List<AdminPermission>> GetActivePermissionsAsync()
        {
            return await _context.AdminPermissions
                .Where(ap => ap.IsActive)
                .OrderBy(ap => ap.Category)
                .ThenBy(ap => ap.Order)
                .ToListAsync();
        }

        public async Task<List<AdminPermission>> GetPermissionsByCategoryAsync(string category)
        {
            return await _context.AdminPermissions
                .Where(ap => ap.Category == category && ap.IsActive)
                .OrderBy(ap => ap.Order)
                .ToListAsync();
        }

        public async Task<AdminPermission?> GetPermissionByKeyAsync(string key)
        {
            return await _context.AdminPermissions
                .FirstOrDefaultAsync(ap => ap.Key == key && ap.IsActive);
        }

        public async Task<List<string>> GetCategoriesAsync()
        {
            return await _context.AdminPermissions
                .Where(ap => ap.IsActive)
                .Select(ap => ap.Category)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();
        }
    }
}