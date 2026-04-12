using Microsoft.EntityFrameworkCore;
using Lifebits.Api.Models;

namespace Lifebits.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Note> Notes => Set<Note>();
    }
}