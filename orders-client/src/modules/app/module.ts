import { AuthInterceptor } from "./services/authInterceptor";
import { OAuthService, OAuthModule } from "angular-oauth2-oidc";
import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserXhr } from "@angular/http";
import { RouterModule } from "@angular/router";

import { RootComponent } from "./components/root/root";
import { ROUTES } from "./routes";
import { HomeComponent } from "./components/home/home";
import { HeaderComponent } from "./components/header/header";
import { MenuComponent } from "./components/menu/menu";
import { WindowRef } from "./services/windowRef";
import { PlatformService } from "./services/platformService";
import { NgProgressCustomBrowserXhr, NgProgressModule } from "ng2-progressbar";
import { NgxElectronModule } from "ngx-electron";
import { DesktopIntegrationService } from "./services/desktopIntegrationService";
import { LoginComponent } from "./components/login/login";
import { IsAuthenticated } from "./guards/isAuthenticated";
import { OrdersService } from "./services/ordersService";
import { OrderListComponent } from "./components/list/orderList";
import { PushService } from "./services/pushService";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";

@NgModule({
  declarations: [
    RootComponent,
    LoginComponent,
    HomeComponent,
    HeaderComponent,
    MenuComponent,
    OrderListComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(ROUTES, { useHash: true }),
    NgProgressModule,
    NgxElectronModule,
    OAuthModule.forRoot()
  ],
  bootstrap: [RootComponent],
  providers: [
    WindowRef,
    OAuthService,
    OrdersService,
    PlatformService,
    PushService,
    DesktopIntegrationService,
    { provide: BrowserXhr, useClass: NgProgressCustomBrowserXhr },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    IsAuthenticated
  ]
})
export class AppModule {}
