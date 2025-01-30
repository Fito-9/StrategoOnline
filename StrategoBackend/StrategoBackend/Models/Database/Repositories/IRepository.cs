namespace StrategoBackend.Models.Database.Repositories
{
    public interface IRepository<TEntity> where TEntity : class
    {
        Task<ICollection<TEntity>> GetAllAsync();
        IQueryable<TEntity> GetQueryable(bool asNoTracking = true);
        Task<TEntity> GetByIdAsync(object id);
        Task<TEntity> InsertAsync(TEntity entity);
        TEntity Update(TEntity entity);
        void Delete(TEntity entity);
        Task<bool> ExistsAsync(object id);
    }
}
