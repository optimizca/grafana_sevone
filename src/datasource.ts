import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  LoadingState,
} from '@grafana/data';

import _ from 'lodash';

import { MyQuery, MyDataSourceOptions } from './types';

import { getBackendSrv, getTemplateSrv } from '@grafana/runtime';

import { SevOneManager } from 'SevOneManager';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  sevOneConnection: SevOneManager;
  url: string | undefined;
  username: string | undefined;
  password: string | undefined;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    if(instanceSettings.jsonData.url?.slice(-1) === "/"){
      this.url = instanceSettings.jsonData.url.slice(0,-1)
    }
    else{
      this.url = instanceSettings.jsonData.url;
    }
    const connectionOptions = {
      url: this.url,
    };
    
    this.username = instanceSettings.jsonData.username;
    this.password = instanceSettings.jsonData.password;
    this.sevOneConnection = new SevOneManager(connectionOptions);
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();

    let token = '';
    let tokenResponse = this.getToken();
    await tokenResponse.then((response) => {
      token = response;
    });

    // Return a constant for each query.
    const promises = _.map(options.targets, async (t) => {
      if (t.hide) {
        return [];
      }
      let target: MyQuery = _.cloneDeep(t);

      let queryType: string = target.selectedQueryCategory.value as string;

      let deviceID = "";
      
      if(typeof target.deviceID === "object"){
        deviceID = getTemplateSrv().replace(target.deviceID.value?.toString(), options.scopedVars, 'csv');
        if(typeof deviceID === "string"){
          let deviceData = this.sevOneConnection.getDevices(token,0,20,0)
          await deviceData.then((response) => {
            for(const device of response.content){
              if(device.name === deviceID){
                deviceID = device.id;
              }
            }
          });
        }
      }

      let objectID = "";
      
      if(typeof target.objectID === "object"){
        objectID = getTemplateSrv().replace(target.objectID.value?.toString(), options.scopedVars, 'csv');
        if(typeof objectID === "string"){
          let objectData = this.sevOneConnection.getObjects(token,0,deviceID,20,0)
          await objectData.then((response) => {
            for(const object of response.content){
              if(object.name === objectID){
                objectID = object.id;
              }
            }
          });
        }
      }

      let indicatorID = "";
      
      if(typeof target.indicatorID === "object"){
        indicatorID = getTemplateSrv().replace(target.indicatorID.value?.toString(), options.scopedVars, 'csv');
        if(typeof indicatorID === "string"){
          let indicatorID = this.sevOneConnection.getIndicators(token,0,deviceID,objectID,20,0)
          await indicatorID.then((response) => {
            for(const indicator of response.content){
              if(indicator.name === indicatorID){
                indicatorID = indicator.id;
              }
            }
          });
        }
      }

      let size = 20;

      if(typeof target.size === "string"){
        size = target.size;
      }

      let page = 0;

      if(typeof target.page === "string"){
        page = target.page;
      }

      switch (queryType) {
        case 'Devices':
          return this.sevOneConnection.getDevices(token,1,size,page);
        case 'Objects':
          return this.sevOneConnection.getObjects(token,1,deviceID,size,page);
        case 'Indicators':
          return this.sevOneConnection.getIndicators(token,1,deviceID,objectID,size,page);
        case 'IndicatorData':
            return this.sevOneConnection.getIndicatorData(token,deviceID,objectID,indicatorID,from,to);
        default:
          return [];
      }
    });

    return Promise.all(_.flatten(promises))
      .then(_.flatten)
      .then((data) => {
        return {
          data,
          state: LoadingState.Done,
          key: options.requestId,
        };
      });
  }

  async testDatasource() {
    let token = '';

    let tokenResponse = this.getToken();
    await tokenResponse.then((response) =>{
      token = response;
    })

    return {
      status: 'success',
      message: 'Success',
    };  
  }

  async getToken() {
    let token = '';
    if(this.username !== undefined && this.password !== undefined)
    {
      let url = this.url+"/api/v2/authentication/signin?nmsLogin=false";
      let header = {"Content-Type": "application/json"};
      let data = {
        name:this.username,
        password:this.password,
      };

      const result = await getBackendSrv().datasourceRequest({
        url: url,
        method: 'POST',
        headers: header,
        data: data
      })
      token = result.data.token;
    }
    return token;
  }
}
