
using StrategoBackend.Models.Database.Entities;

namespace StrategoBackend.Models.Database.Repositories
{
    public class ImageRepository : Repository<Image>
    {
        public ImageRepository(MyDbContext context) : base(context)
        {
        }
    }
}
