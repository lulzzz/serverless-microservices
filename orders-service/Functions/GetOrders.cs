
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
using System.Collections.Generic;
using System.Linq;
using Microsoft.Azure.Documents;

namespace Serverless
{
    public static class GetOrdersFunction
    {
        [FunctionName("GetOrders")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "GET", Route = "orders")]
            HttpRequest req,

            [CosmosDB("ordersservice", "data", ConnectionStringSetting = "CosmosDB")]
            IEnumerable<NewOrderMessage> ordersdata,

            ILogger log)
        {
            log.LogInformation("GetOrders HTTP trigger function processed a request.");

            if (!await req.CheckAuthorization("api"))
            {
                return new UnauthorizedResult();
            }

            var orders = ordersdata.Select(doc => doc.Order).OrderByDescending(o => o.Created).ToList();

            return new OkObjectResult(orders);
        }
    }
}
