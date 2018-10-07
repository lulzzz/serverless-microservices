import { Injectable, Injector } from "@angular/core";
import { Http, Response, URLSearchParams } from "@angular/http";

import { Observable } from "rxjs/Rx";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/map";
import "rxjs/add/operator/finally";
import "rxjs/add/observable/throw";
import "rxjs/add/observable/of";

import { TokenResponse } from "../models/tokenResponse";
import { AuthenticatedHttpService } from "./authenticatedHttpService";
import { User } from "../models/user";
import { SecurityConfiguration } from "../models/securityConfiguration";
import { StorageService } from "./storageService";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { environment } from "../../../environments/environment";

const ACCESS_TOKEN_STORAGE_KEY = "accessToken";

@Injectable()
export class SecurityService {
  private _loginObservable: Observable<any>;
  private _activateSessionObservable: Observable<any>;
  private _accessToken: string;
  private _user: User;

  public userLoggedIn: BehaviorSubject<string> = new BehaviorSubject(null);

  public get accessToken(): string {
    return this._accessToken;
  }

  public get user(): User {
    return this._user;
  }

  public get isLoggedIn(): boolean {
    return this._accessToken && !!this._user;
  }

  constructor(
    private _http: Http,
    private _storageService: StorageService,
    private _securityConfiguration: SecurityConfiguration,
    private _injector: Injector
  ) {
    if (!environment.idpUrl) {
      throw new Error("idpUrl not set.");
    }
  }

  // To avoid circular dependencies
  private getAuthenticatedHttpService(): AuthenticatedHttpService {
    return this._injector.get(AuthenticatedHttpService);
  }

  public login(username: string, password: string): Observable<any> {
    if (!username) {
      return Observable.throw("Username not set.");
    }

    if (!password) {
      return Observable.throw("Password not set.");
    }

    if (this._loginObservable) {
      return this._loginObservable;
    }

    const payload = this.createTokenRequestPayload();
    payload.append("grant_type", "password");
    payload.append("username", username);
    payload.append("password", password);
    payload.append("scope", this._securityConfiguration.scope);

    return (this._loginObservable = this._http
      .post(`${environment.idpUrl}connect/token`, payload)
      .map((response: Response) => response.json())
      .switchMap(async (tokenResponse: TokenResponse) => {
        this.validateTokenResponse(tokenResponse);
        return this._storageService.save(
          ACCESS_TOKEN_STORAGE_KEY,
          tokenResponse.access_token
        );
      })
      .switchMap(() => this.activateSession())
      .finally(() => (this._loginObservable = void 0))
      .share());
  }

  private createTokenRequestPayload(): URLSearchParams {
    const payload = new URLSearchParams();
    payload.append("client_id", this._securityConfiguration.clientId);
    payload.append("client_secret", this._securityConfiguration.clientSecret);
    return payload;
  }

  public logout(): Observable<void> {
    return this._storageService
      .delete(ACCESS_TOKEN_STORAGE_KEY)
      .switchMap(() => this.revokeToken())
      .finally(() => {
        this._accessToken = void 0;
        this._user = void 0;
      });
  }

  public activateSession(): Observable<boolean> {
    if (this._activateSessionObservable) {
      return this._activateSessionObservable;
    }

    return (this._activateSessionObservable = this._storageService
      .load<string>(ACCESS_TOKEN_STORAGE_KEY)
      .map(accessToken => {
        this._accessToken = accessToken;
        this.userLoggedIn.next(accessToken);
      })
      .switchMap(() => this.loadUserInformation())
      .finally(() => (this._activateSessionObservable = void 0))
      .catch(() => Observable.of(false))
      .share());
  }

  private loadUserInformation(): Observable<any> {
    return this.getAuthenticatedHttpService()
      .get(`${environment.idpUrl}connect/userinfo`)
      .map((response: Response) => response.json())
      .map(user => (this._user = User.fromPojo(user)));
  }

  private revokeToken(): Observable<any> {
    const payload = this.createTokenRequestPayload();
    payload.append("token", this._accessToken);
    payload.append("token_type_hint", "access_token");

    return this.getAuthenticatedHttpService().post(
      `${environment.idpUrl}connect/revocation`,
      payload
    );
  }

  private validateTokenResponse(tokenResponse: TokenResponse) {
    if (!tokenResponse) {
      throw new Error("No token could be obtained.");
    }

    if (!tokenResponse.access_token) {
      throw new Error("No access token could be obtained.");
    }
  }
}
