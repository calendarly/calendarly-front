import * as MainActions from './../layout/store/main.actions';
import { AppState } from './../store/app.reducers';
import { SharedService } from './shared.service';
import { Router } from '@angular/router';
import { ContainerService } from './container.service';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {config} from './config';
import 'rxjs';
import { catchError } from 'rxjs/operators/catchError';
import { Store } from '@ngrx/store';


@Injectable()
export class AuthService {

  constructor(private http:HttpClient,private container:ContainerService,
  private router:Router,private sharedService:SharedService,
  private store:Store<AppState>) { }

  authenticateUser(data)
  {
    this.container.authHeader='Bearer'
    return this.http.post(config.url+'/api/v1/auth',data).flatMap((res:any)=>{
    window[this.container.storageStrategy].setItem('authToken',res.auth_token);
    this.container.isAuthenticated=true;
    this.store.dispatch(new MainActions.UserUpdated(res));
    this.store.dispatch(new MainActions.AuthenticateUser({isAuthenticated:true,user:res}))   
    return this.getToken();
    }).pipe(catchError(this.sharedService.handleError));
  }

  forgotPassword(userInfo)
  {
    return this.http.post(config.url+'/api/v1/users/password_recovery',{username:userInfo})
    .map(res=>{
      return res;
    }).pipe(catchError(this.sharedService.handleError));
  }

  signupUser(data)
  {
    return this.http.post(config.url+'/api/v1/auth/register',data)
    .map((res:any)=>{
    window[this.container.storageStrategy].setItem('authToken',res.auth_token);
    this.container.isAuthenticated=true;
    this.store.dispatch(new MainActions.UserUpdated(res));
    this.container.user=res;
    return res;
    }).pipe(catchError(this.sharedService.handleError));
  }
  


  getToken()
  {
    var data={
      "application": this.container.appId,
      "state": this.container.appState
             }
    return this.http.post(config.url+`/api/v1/application-tokens/authorize`,data).flatMap((res:any)=>{
    window[this.container.storageStrategy].setItem('auth_code',res.auth_code);
    this.container.auth_code=res.auth_code;
    this.container.isAuthenticated=true;    
    return this.validateToken();
    }).pipe(catchError(this.sharedService.handleError));
  }

  validateToken()
  {
    var authCode=window[this.container.storageStrategy].getItem('auth_code')
    var data={
      "application": this.container.appId,
      "auth_code": authCode,
      "state": this.container.appState
  }
  console.log(data)
    return this.http.post(config.url+`/api/v1/application-tokens/validate`,data).map((res:any)=>{
    window[this.container.storageStrategy].setItem('cypheredToken',res.token);
    this.container.cypheredToken=res.token;
    this.container.authHeader='Application';
    return res;
    }).pipe(catchError(this.sharedService.handleError));
  }

  getUserDetails()
  {
    return this.http.get(config.url+`/api/v1/users/me`).map((res:any)=>{
      this.store.dispatch(new MainActions.UserUpdated(res));
      this.container.user=res;
      return res;
    }).pipe(catchError(this.sharedService.handleError));
  }

  handleError(er)
  {
    if(er.status===401)
    {
      this.router.navigate(['/','pages','login']);
      window[this.container.storageStrategy].removeItem('authToken');
      window[this.container.storageStrategy].removeItem('auth_code');
    }
  }

}
