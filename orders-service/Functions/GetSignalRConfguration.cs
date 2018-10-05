using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Azure.WebJobs.Host;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Microsoft.Azure.WebJobs.Extensions.SignalRService;

namespace Serverless
{
    public static class GetSignalRConfigurationFunction
    {
        [FunctionName("GetSignalRConfguration")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "GET", Route = "signalrconfig")]
            HttpRequest req,

            [SignalRConnectionInfo(HubName = "shippingsHub", ConnectionStringSetting="SignalR")]
            SignalRConnectionInfo connectionInfo,

            ILogger log)
        {
            log.LogInformation("GetSignalRConfigurationFunction# HTTP trigger function processed a request.");

            if (!await req.CheckAuthorization("api"))
            {
                return new UnauthorizedResult();
            }

            return new OkObjectResult(connectionInfo);
        }
    }
}
