
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
using AutoMapper;

namespace Serverless
{
    public static class SubmitNewOrderFunction
    {
        static SubmitNewOrderFunction()
        {
            InitializeMapper();
        }

        [FunctionName("SubmitNewOrder")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "POST", Route = "orders")]
            //DTOs.Order newOrder, // there is a bug with deserialization: https://github.com/Azure/azure-functions-host/issues/3370
            HttpRequest req,

            [ServiceBus("neworders", Connection="ServiceBus")]
            IAsyncCollector<Messages.NewOrderMessage> messages,

            ILogger log)
        {
            log.LogInformation("SubmitNewOrder HTTP trigger function processed a request.");

            if (!await req.CheckAuthorization("api"))
            {
                return new UnauthorizedResult();
            }

            var newOrder = req.Deserialize<DTOs.Order>();
            newOrder.Id = Guid.NewGuid();
            newOrder.Created = DateTime.UtcNow;

            var identity = Thread.CurrentPrincipal.Identity as ClaimsIdentity;
            var userId = identity.Name;

            var newOrderMessage = new Messages.NewOrderMessage
            {
                Order = Mapper.Map<Messages.Order>(newOrder),
                UserId = userId
            };

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

        private static void InitializeMapper()
        {
            Mapper.Initialize(cfg =>
            {
                cfg.CreateMap<DTOs.OrderItem, Messages.OrderItem>();
                cfg.CreateMap<DTOs.Order, Messages.Order>()
                    .ForMember(d => d.Items, opt => opt.MapFrom(s => s.Items));
            });
            Mapper.AssertConfigurationIsValid();
        }
    }
}
