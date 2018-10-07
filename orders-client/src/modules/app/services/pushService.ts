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
  private _hubConnection: HubConnection;

  public orderShipping: BehaviorSubject<string> = new BehaviorSubject(null);
  public orderCreated: BehaviorSubject<string> = new BehaviorSubject(null);

  constructor(private _http: HttpClient) {}

  public start(): void {
    this.getConnectionInfo().subscribe(config => {
      console.log(`Received info for endpoint ${config.url}`);

      const options: IHttpConnectionOptions = {
        accessTokenFactory: () => config.accessToken
      };

      this._hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(config.url, options)
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this._hubConnection
        .start()
        .then(() => {
          console.log("SignalR connection established.");

          this._hubConnection.on("orderCreated", () => {
            this.orderCreated.next(null);
          });

          this._hubConnection.on("shippingCreated", orderId => {
            this.orderShipping.next(orderId);
          });
        })
        .catch(err =>
          console.error("SignalR connection not established. " + err)
        );
    });
  }

  public stop(): void {
    if (this._hubConnection) {
      this._hubConnection.stop();
    }

    this._hubConnection = undefined;
  }

  private getConnectionInfo(): Observable<SignalRConnectionInformation> {
    const requestUrl = `${environment.webApiBaseUrl}signalrconfig`;

    return this._http.get<SignalRConnectionInformation>(requestUrl);
  }
}
