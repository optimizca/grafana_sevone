import _ from 'lodash';
import { MutableDataFrame, FieldType } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';

import { TIME_FILED_NAMES } from './Constants';

export class SevOneManager {
  dsProxyUrl: string;

  constructor(options: any) {
    this.dsProxyUrl = options.dsProxyUrl;
  }

  async request(endpoint: string, token: any) {
    let header = {}
    if(token !== ""){
      header = {"X-AUTH-TOKEN":token};
    }
    const result = getBackendSrv().datasourceRequest({
      url: this.dsProxyUrl + "/api" + endpoint,
      method: 'GET',
      headers: header,
    });
    return result;
  }

  async getAllDevices(token: any, queryType: number) {
    let url = `/api/v2/devices?includeCount=true&page=${0}&size=${10000}`;
    let data = await this.request(url,token);
    let loopRunsNum = data.data.totalPages - 1;
    let results = {content:data.data.content}

    for(let i = 1; i <= loopRunsNum; i++){
      url = `/api/v2/devices?includeCount=true&page=${i}&size=${10000}`;
      data = await this.request(url,token);
      results.content = results.content.concat(data.data.content)
    }

    if(queryType === 0){
      return results;
    }else{
      return this.mapDataToVariable(results);
    }
  }

  async getDevice(token: any, deviceId: string) {
    let url = `/api/v2/devices/${deviceId}`;
    let data = await this.request(url,token);
    return this.mapDeviceDataToFrame(data);
  }

  async getDevices(token: any, queryType: number, size: number, page: number) {
    let url = `/api/v2/devices?includeCount=false&page=${page}&size=${size}`;
    let data = await this.request(url,token);
    if(queryType === 0){
      return data.data;
    }else if (queryType === 1) {
      return this.mapDataToFrame(data);
    }else {
      return this.mapDataToVariable(data.data);
    }
  }

  async getObjects(token: any, queryType: number, deviceId: string | undefined, size: number, page: number) {
    let url = `/api/v2/devices/${deviceId}/objects?page=${page}&size=${size}`;
    let data = await this.request(url,token);
    if(queryType === 0){
      return data.data;
    }else if (queryType === 1){
      return this.mapDataToFrame(data);
    } else {
      return this.mapDataToVariable(data.data);
    }
  }

  async getIndicators(token: any, queryType: number, deviceId: string | undefined, objectId: string | undefined, size: number, page: number) {
    let url = `/api/v2/devices/${deviceId}/objects/${objectId}/indicators?page=${page}&size=${size}`;
    let data = await this.request(url,token);
    if(queryType === 0){
      return data.data;
    }else if (queryType === 1){
      return this.mapDataToFrame(data);
    } else {
      return this.mapDataToVariable(data.data);
    }
  }

  async getIndicatorData(token: any, deviceId: string | undefined, objectId: string | undefined, indicatorId: string | undefined, starttime: number | undefined, endtime: number | undefined) {
    let url = `/api/v2/devices/${deviceId}/objects/${objectId}/indicators/${indicatorId}/data?endTime=${endtime}&startTime=${starttime}`;
    let data = await this.request(url,token);
    return this.mapIndicatorDataToFrame(data);
  }

  async mapDataToFrame(result: any) {
    const frame = new MutableDataFrame({
      fields: [],
    });
    if (!(result.data.content.length > 0)) {
      return [];
    }
    let filedNames = Object.keys(result.data.content[0]);
    for (let i = 0; i < filedNames.length; i++) {
      let values = result.data.content.map((d: any) => d[filedNames[i]]);

      let fieldType = FieldType.string;
      if(typeof values[0] === "number"){
        if(TIME_FILED_NAMES.includes(filedNames[i])){
          fieldType = FieldType.time;
        }else{
          fieldType = FieldType.number;
        }
      }
      if(typeof values[0] === "boolean"){
        fieldType = FieldType.boolean;
      }

      if((values.every((value: any) => typeof value === "object")) && (!values.every((value: any) => value === null))){
        let objectFiledNames: string | string[] = [];
        for(const value of values){
          if(value !== null){
            let keys = Object.keys(value)
            for(const key of keys){
              if(!objectFiledNames.includes(key)){
                objectFiledNames.push(key)
              }
            }
          }
        }
        for (let z = 0; z < objectFiledNames.length; z++) {
          let objectValues = values.map((d: any) => {
            if(d !== null && objectFiledNames[z] in d){
              return d[objectFiledNames[z]];
            }else{
              return null
            }
          });
          frame.addField({
            name: filedNames[i]+"."+objectFiledNames[z],
            type: FieldType.string,
            values: objectValues,
          });
        }
      }else{
        frame.addField({
          name: filedNames[i],
          type: fieldType,
          values: values,
        });
      }
    }

    return frame;
  }

  async mapIndicatorDataToFrame(result: any) {
    const frame = new MutableDataFrame({
      fields: [],
    });
    if (!(result.data.length > 0)) {
      return [];
    }
    let filedNames = Object.keys(result.data[0]);
    for (let i = 0; i < filedNames.length; i++) {
      if(filedNames[i] !== "focus"){
        let values = result.data.map((d: any) => d[filedNames[i]]);

        let fieldType = FieldType.string;
        if(typeof values[0] === "number"){
          if(TIME_FILED_NAMES.includes(filedNames[i])){
            fieldType = FieldType.time;
          }else{
            fieldType = FieldType.number;
          }
        }

        frame.addField({
          name: filedNames[i],
          type: fieldType,
          values: values,
        });
      }
    }

    return frame;
  }

  async mapDeviceDataToFrame(result: any) {
    const frame = new MutableDataFrame({
      fields: [],
    });
    let filedNames = Object.keys(result.data);
    for (let i = 0; i < filedNames.length; i++) {
      if(filedNames[i] !== "pluginInfo"){
        let values = [result.data[filedNames[i]]];
        let fieldType = FieldType.string;
        if(typeof values === "number"){
          if(TIME_FILED_NAMES.includes(filedNames[i])){
            fieldType = FieldType.time;
          }else{
            fieldType = FieldType.number;
          }
        }

        frame.addField({
          name: filedNames[i],
          type: fieldType,
          values: values,
        });
      }
    }

    return frame;
  }

  async mapDataToVariable(result: any) {

    let resultsparsed = result.content.map((row: any)=>{
      return { text: row.name, value: row.id };
    })

    return resultsparsed;
  }
}
