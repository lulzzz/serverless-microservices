using IdentityModel.Client;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace Serverless
{
    public static class AuthorizationValidation
    {
        public static async Task<bool> CheckAuthorization(this HttpRequest req, string resource)
        {
            if (!req.Headers.ContainsKey("Authorization"))
            {
                return false;
            }

            var headerValue = req.Headers["Authorization"];
            var bearerToken = headerValue.ToString();
            bearerToken = bearerToken.Replace("Bearer ", String.Empty);

            if (String.IsNullOrWhiteSpace(bearerToken))
            {
                return false;
            }

            var principal = await ValidateToken(bearerToken,
                Environment.GetEnvironmentVariable("IdpAuthority"), resource);

            return principal != null;
        }

        private static async Task<ClaimsPrincipal> ValidateToken(string jwtToken, string issuer, string resource)
        {
            var introspectionClient = new IntrospectionClient(
                Environment.GetEnvironmentVariable("IdpIntrospectionEndpoint"),
                Environment.GetEnvironmentVariable("IdpIntrospectionEndpointClientId"),
                Environment.GetEnvironmentVariable("IdpIntrospectionEndpointClientSecret"));

            var response = await introspectionClient.SendAsync(
                new IntrospectionRequest { Token = jwtToken });

            if (!response.IsActive)
            {
                return null;
            }

            var handler = new JwtSecurityTokenHandler();
            handler.InboundClaimTypeMap.Clear();

            var principal = handler.ValidateToken(jwtToken, new TokenValidationParameters()
            {
                ValidIssuer = issuer,
                ValidAudience = resource,
                ValidateIssuerSigningKey = false,
                SignatureValidator = (t, param) => new JwtSecurityToken(t),
                NameClaimType = "sub"

            }, out SecurityToken _);

            Thread.CurrentPrincipal = principal;

            return principal;
        }
    }
}
