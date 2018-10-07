
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
using Microsoft.Azure.ServiceBus;
using System.Threading;
using System.Security.Claims;
using System.Linq;
using Microsoft.Azure.Documents;

namespace Serverless
{
    public static class SubmitNewOrderFunction
    {
        [FunctionName("SubmitNewOrder")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "POST", Route = "orders")]
            //Order newOrder,
            HttpRequest req,

            [ServiceBus("neworders", Connection="ServiceBus")]
            IAsyncCollector<NewOrderMessage> messages,

            ILogger log)
        {
            log.LogInformation("SubmitNewOrder HTTP trigger function processed a request.");

            if (!await req.CheckAuthorization("api"))
            {
                return new UnauthorizedResult();
            }

            var newOrder = req.Deserialize<Order>();
            newOrder.Id = Guid.NewGuid();
            newOrder.Created = DateTime.UtcNow;

            var identity = Thread.CurrentPrincipal.Identity as ClaimsIdentity;
            var userId = identity.Name;

            var newOrderMessage = new NewOrderMessage { Order = newOrder, UserId = userId };

            try
            {
                await messages.AddAsync(newOrderMessage);
                await messages.FlushAsync();
            }
            catch (ServiceBusException sbx)
            {
                // TODO: retry policy...
                log.LogError(sbx, "Service Bus Error");
                throw;
            }

            return new OkResult();
        }
    }
}
