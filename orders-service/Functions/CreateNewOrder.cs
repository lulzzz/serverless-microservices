
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
using Microsoft.Azure.WebJobs.Extensions.SignalRService;

namespace Serverless
{
    public static class CreateNewOrderFunction
    {
        [FunctionName("CreateNewOrder")]
        public static async Task Run(
            [ServiceBusTrigger("neworders", Connection = "ServiceBus")]
            NewOrderMessage message,

            [CosmosDB("ordersservice", "data", ConnectionStringSetting = "CosmosDB")]
            IAsyncCollector<NewOrderMessage> data,

            [ServiceBus("ordersforshipping", Connection = "ServiceBus")]
            IAsyncCollector<NewOrderMessage> messages,

            [SignalR(HubName="ordersHub", ConnectionStringSetting="SignalR")]
            IAsyncCollector<SignalRMessage> notificationMessages,

            ILogger log)
        {
            log.LogInformation("CreateNewOrder SB queue trigger function processed a request.");

            // TODO: talk to other systems, do checks etc. ... - the REAL work :-)

            try
            {
                await data.AddAsync(message);
                await data.FlushAsync();
            }
            catch (DocumentClientException dcx)
            {
                // TODO: retry policy...
                log.LogError(dcx, "Cosmos DB Error");
                throw;
            }

            try
            {
                await messages.AddAsync(message);
                await messages.FlushAsync();
            }
            catch (ServiceBusException sbx)
            {
                // TODO: retry policy...
                log.LogError(sbx, "Service Bus Error");
                throw;
            }

            // NOTE: Group feature not yet available in SignalR binding
            var messageToNotify = new { userId = message.UserId, orderId = message.Order.Id };

            await notificationMessages.AddAsync(new SignalRMessage
            {
                Target = "orderCreated",
                Arguments = new[] { messageToNotify }
            });
        }
    }
}
