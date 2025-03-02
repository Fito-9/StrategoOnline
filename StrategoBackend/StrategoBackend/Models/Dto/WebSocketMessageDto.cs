
using System.Text.Json.Serialization;

namespace StrategoBackend.Models.Dto
{
    public class WebSocketMessageDto
    {
        [JsonPropertyName("type")]
        public string Type { get; set; }

        [JsonPropertyName("payload")]
        public object Payload { get; set; }
    }
}
