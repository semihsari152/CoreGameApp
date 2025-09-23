using Microsoft.AspNetCore.Mvc;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        [HttpGet("ping")]
        public ActionResult<string> Ping()
        {
            return Ok("pong");
        }

        [HttpGet("user/{id}/posts")]
        public ActionResult<object> GetUserPosts(int id)
        {
            return Ok(new { userId = id, posts = new[] { "post1", "post2", "post3" } });
        }
    }
}
