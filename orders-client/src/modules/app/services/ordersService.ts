import { Injectable } from "@angular/core";
import "rxjs/add/operator/map";
import { AuthenticatedHttpService } from "./authenticatedHttpService";
import { environment } from "../../../environments/environment";

@Injectable()
export class OrdersService {
  constructor(private _http: AuthenticatedHttpService) {}

  public getOrders() {
    return this._http
      .get(environment.webApiBaseUrl + "orders")
      .map(result => result.json());
  }
}
