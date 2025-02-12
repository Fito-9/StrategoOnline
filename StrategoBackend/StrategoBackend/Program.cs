using Microsoft.IdentityModel.Tokens;
using StrategoBackend;
using StrategoBackend.Models.Database;
using StrategoBackend.Services;
using StrategoBackend.WebSockets;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<WebSocketNetwork>();
builder.Services.AddTransient<WebSocketMiddleware>();
builder.Services.AddScoped<MyDbContext>();
builder.Services.AddScoped<UnitOfWork>();

builder.Services.AddScoped<FriendshipService>();

builder.Services.AddScoped<IFriendshipRepository, FriendshipRepository>();

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

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

builder.Services.AddAuthentication().AddJwtBearer();

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

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads")),
    RequestPath = "/uploads"
});

app.UseHttpsRedirection();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.UseWebSockets();    
app.UseMiddleware<WebSocketMiddleware>();

app.MapControllers();
await InitDatabaseAsync(app.Services);
await app.RunAsync();