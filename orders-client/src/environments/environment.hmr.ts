import { AuthConfig } from "angular-oauth2-oidc";

export const environment = {
  production: false,
  hmr: true,

  loginRoute: "/login",
  webApiBaseUrl: "http://localhost:53278/api/"
};

export const resourceOwnerConfig: AuthConfig = {
  issuer: "https://tt-identityserver4-demo.azurewebsites.net",
  clientId: "resourceowner",
  dummyClientSecret: "no-really-a-secret",
  scope: "openid profile email api",
  oidc: false
};
