import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { HubConnection, IHttpConnectionOptions } from "@aspnet/signalr";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs/Observable";
import { SignalRConnectionInformation } from "../models/signalRConnectionInformation";
import { HttpClient } from "@angular/common/http";
import signalR = require("@aspnet/signalr");

@Injectable()
export class PushService {
  private _ordersHubConnection: HubConnection;
  private _shippingsHubConnection: HubConnection;

  public orderShipping: BehaviorSubject<string> = new BehaviorSubject(null);
  public orderCreated: BehaviorSubject<string> = new BehaviorSubject(null);

  constructor(private _http: HttpClient) {}

  public start(): void {
    this.getConnectionInfo("ordersHub").subscribe(config => {
      console.log(`Received info for Orders endpoint ${config.url}`);

      const options: IHttpConnectionOptions = {
        accessTokenFactory: () => config.accessToken
      };

      this._ordersHubConnection = new signalR.HubConnectionBuilder()
        .withUrl(config.url, options)
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this._ordersHubConnection
        .start()
        .then(() => {
          console.log("Orders SignalR connection established.");

          this._ordersHubConnection.on("orderCreated", message => {
            this.orderCreated.next(message.orderId);
          });
        })
        .catch(err =>
          console.error("Orders SignalR connection not established. " + err)
        );
    });

    this.getConnectionInfo("shippingsHub").subscribe(config => {
      console.log(`Received info for Shippings endpoint ${config.url}`);

      const options: IHttpConnectionOptions = {
        accessTokenFactory: () => config.accessToken
      };

      this._shippingsHubConnection = new signalR.HubConnectionBuilder()
        .withUrl(config.url, options)
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this._shippingsHubConnection
        .start()
        .then(() => {
          console.log("Shippings SignalR connection established.");

          this._shippingsHubConnection.on("shippingInitiated", message => {
            this.orderShipping.next(message.orderId);
          });
        })
        .catch(err =>
          console.error("Shippings SignalR connection not established. " + err)
        );
    });
  }

  public stop(): void {
    if (this._ordersHubConnection) {
      this._ordersHubConnection.stop();
    }

    this._ordersHubConnection = undefined;

    if (this._shippingsHubConnection) {
      this._shippingsHubConnection.stop();
    }

    this._shippingsHubConnection = undefined;
  }

  private getConnectionInfo(
    hubName: string
  ): Observable<SignalRConnectionInformation> {
    const requestUrl = `${environment.webApiBaseUrl}config/${hubName}`;

    return this._http.get<SignalRConnectionInformation>(requestUrl);
  }
}
