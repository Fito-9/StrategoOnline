using Microsoft.IdentityModel.Tokens;
using StrategoBackend;
using StrategoBackend.Models.Database;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<MyDbContext>();

builder.Services.AddSingleton(provider =>
{
    Settings settings = builder.Configuration.GetSection(Settings.SECTION_NAME).Get<Settings>();
    return new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.JwtKey))
    };
});

builder.Services.AddAuthentication().AddJwtBearer();

var app = builder.Build();

static async Task InitDatabaseAsync(IServiceProvider serviceProvider)
{
    using IServiceScope scope = serviceProvider.CreateScope();
    using MyDbContext dbContext = scope.ServiceProvider.GetService<MyDbContext>();

    if (dbContext.Database.EnsureCreated())
    {
        Seeder seeder = new Seeder(dbContext);
        seeder.Seed();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
await InitDatabaseAsync(app.Services);
await app.RunAsync();
