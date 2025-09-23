using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IGuideBlockRepository : IRepository<GuideBlock>
    {
        Task<IEnumerable<GuideBlock>> GetByGuideIdAsync(int guideId);
        Task<GuideBlock?> GetByGuideIdAndOrderAsync(int guideId, int order);
        Task ReorderBlocksAsync(int guideId, List<(int blockId, int newOrder)> reorderList);
        Task DeleteByGuideIdAsync(int guideId);
    }
}