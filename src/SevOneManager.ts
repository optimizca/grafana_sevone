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
    let header = {};
    if (token !== '') {
      header = { 'X-AUTH-TOKEN': token };
    }
    const result = getBackendSrv().datasourceRequest({
      url: this.dsProxyUrl + '/api' + endpoint,
      method: 'GET',
      headers: header,
    });
    return result;
  }

  async postRequest(endpoint: string, token: any, body: any) {
    let header = {};
    if (token !== '') {
      header = { 'X-AUTH-TOKEN': token };
    }
    const result = getBackendSrv().datasourceRequest({
      url: this.dsProxyUrl + '/api' + endpoint,
      method: 'POST',
      headers: header,
      data: body,
    });
    return result;
  }

  async getAllDevices(token: any, queryType: number) {
    let url = `/api/v2/devices?includeCount=true&page=${0}&size=${1}`;
    let data = await this.request(url, token);
    let loopRunsNum = Math.round(data.data.totalElements / 10000);

    let responses: any[] = [];
    for (let i = 0; i <= loopRunsNum; i++) {
      url = `/api/v2/devices?includeCount=true&page=${i}&size=${10000}`;
      responses.push(
        this.request(url, token).then((response) => {
          return response.data.content;
        })
      );
    }
    responses = await Promise.all(responses);
    let results = { content: [].concat(...responses) };
    if (queryType === 0) {
      return results;
    } else if (queryType === 3) {
      return this.mapDataToSelect(results.content);
    } else {
      return this.mapDataToVariable(results);
    }
  }

  async getDevice(token: any, deviceId: string | null | undefined) {
    if (deviceId === undefined || deviceId === null) {
      return [];
    }
    let url = `/api/v2/devices/${deviceId}`;
    let data = await this.request(url, token);
    return this.mapDeviceDataToFrame(data);
  }

  async getDeviceID(token: any, deviceName: string) {
    let url = `/api/v2/devices/filter`;
    let body = { name: deviceName };
    let result: any = await this.postRequest(url, token, body);
    let deviceID = '0';
    if (result.data.content && result.data.content.length > 0) {
      deviceID = result.data.content[0].id;
    }
    return deviceID;
  }

  async getDevices(token: any, queryType: number, size: number, page: number) {
    let url = `/api/v2/devices?includeCount=false&page=${page}&size=${size}`;
    let data = await this.request(url, token);
    if (queryType === 0) {
      return data.data;
    } else if (queryType === 1) {
      return this.mapDataToFrame(data.data.content);
    } else if (queryType === 3) {
      return this.mapDataToSelect(data.data.content);
    } else {
      return this.mapDataToVariable(data.data);
    }
  }

  async getObjects(token: any, queryType: number, deviceId: string | undefined, size: number, page: number) {
    if (deviceId === undefined || deviceId === null) {
      return [];
    }
    let url = `/api/v2/devices/${deviceId}/objects?page=${page}&size=${size}`;
    let data = await this.request(url, token);
    if (queryType === 0) {
      return data.data;
    } else if (queryType === 1) {
      return this.mapDataToFrame(data.data.content);
    } else if (queryType === 3) {
      return this.mapDataToSelect(data.data.content);
    } else {
      return this.mapDataToVariable(data.data);
    }
  }

  async getObjectID(token: any, deviceID: string | null | undefined, objectName: string) {
    if (deviceID === undefined || deviceID === null) {
      return '';
    }
    let url = `/api/v2/devices/objects/filter`;
    let body = { name: objectName, deviceIds: [+deviceID] };
    let result: any = await this.postRequest(url, token, body);
    let objectID = '0';
    if (result.data.content && result.data.content.length > 0) {
      objectID = result.data.content[0].id;
    }
    return objectID;
  }

  async getIndicators(
    token: any,
    queryType: number,
    deviceId: string | undefined,
    objectId: string | undefined,
    size: number,
    page: number
  ) {
    if (deviceId === undefined || deviceId === null || objectId === undefined || objectId === null) {
      return [];
    }
    let url = `/api/v2/devices/${deviceId}/objects/${objectId}/indicators?page=${page}&size=${size}`;
    let data = await this.request(url, token);
    if (queryType === 0) {
      return data.data;
    } else if (queryType === 1) {
      return this.mapDataToFrame(data.data.content);
    } else if (queryType === 3) {
      return this.mapDataToSelect(data.data.content);
    } else {
      return this.mapDataToVariable(data.data);
    }
  }

  async getIndicatorData(
    token: any,
    deviceId: string | undefined,
    objectId: string | undefined,
    indicatorId: string | undefined,
    starttime: number | undefined,
    endtime: number | undefined
  ) {
    if (
      deviceId === undefined ||
      deviceId === null ||
      objectId === undefined ||
      objectId === null ||
      indicatorId === undefined ||
      indicatorId === null
    ) {
      return [];
    }
    let url = `/api/v2/devices/${deviceId}/objects/${objectId}/indicators/${indicatorId}/data?endTime=${endtime}&startTime=${starttime}`;
    let data = await this.request(url, token);
    return this.mapIndicatorDataToFrame(data);
  }

  async getDeviceGroups(token: any, queryType: number, size: number, page: number) {
    let url = `/api/v2/devicegroups?includeMembers=false&page=${page}&size=${size}`;
    let response = await this.request(url, token);
    if (queryType === 1) {
      return this.mapDataToFrame(response.data.content);
    } else if (queryType === 3) {
      return this.mapDataToSelect(response.data.content);
    } else {
      return this.mapDataToVariable(response.data);
    }
  }

  async getAllDeviceGroups(token: any, queryType: number) {
    let url = `/api/v2/devicegroups?includeMembers=false&includeCount=true&page=0&size=1`;
    let counterResponse = await this.request(url, token);
    let loopRunsNum = Math.round(counterResponse.data.totalElements / 10000);

    let responses: any[] = [];
    for (let i = 0; i <= loopRunsNum; i++) {
      url = `/api/v2/devicegroups?includeMembers=false&page=${i}&size=${10000}`;
      responses.push(
        this.request(url, token).then((response) => {
          return response.data.content;
        })
      );
    }
    responses = await Promise.all(responses);
    let results = { content: [].concat(...responses) };
    if (queryType === 1) {
      return this.mapDataToFrame(results.content);
    } else if (queryType === 3) {
      return this.mapDataToSelect(results.content);
    } else {
      return this.mapDataToVariable(results);
    }
  }

  async getDeviceGroupMembers(token: any, queryType: number, deviceGroupID: string | undefined) {
    if (deviceGroupID === undefined || deviceGroupID === null) {
      return [];
    }
    let url = `/api/v2/devicegroups/${deviceGroupID}?includeMembers=true`;
    let response = await this.request(url, token);
    if (queryType === 1) {
      return this.mapDataToFrame(response.data.devices);
    } else if (queryType === 3) {
      return this.mapDataToSelect(response.data.devices);
    } else {
      return this.mapDataToVariable(response.data.devices);
    }
  }

  async mapDataToFrame(result: any) {
    const frame = new MutableDataFrame({
      fields: [],
    });
    if (result === undefined || result === null || !(result.length > 0)) {
      return [];
    }
    let filedNames = Object.keys(result[0]);
    for (let i = 0; i < filedNames.length; i++) {
      let values = result.map((d: any) => d[filedNames[i]]);

      let fieldType = FieldType.string;
      if (typeof values[0] === 'number') {
        if (TIME_FILED_NAMES.includes(filedNames[i])) {
          fieldType = FieldType.time;
        } else {
          fieldType = FieldType.number;
        }
      }
      if (typeof values[0] === 'boolean') {
        fieldType = FieldType.boolean;
      }

      if (values.every((value: any) => typeof value === 'object') && !values.every((value: any) => value === null)) {
        let objectFiledNames: string | string[] = [];
        for (const value of values) {
          if (value !== null) {
            let keys = Object.keys(value);
            for (const key of keys) {
              if (!objectFiledNames.includes(key)) {
                objectFiledNames.push(key);
              }
            }
          }
        }
        for (let z = 0; z < objectFiledNames.length; z++) {
          let objectValues = values.map((d: any) => {
            if (d !== null && objectFiledNames[z] in d) {
              return d[objectFiledNames[z]];
            } else {
              return null;
            }
          });
          frame.addField({
            name: filedNames[i] + '.' + objectFiledNames[z],
            type: FieldType.string,
            values: objectValues,
          });
        }
      } else {
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
      if (filedNames[i] !== 'focus') {
        let values = result.data.map((d: any) => d[filedNames[i]]);

        let fieldType = FieldType.string;
        if (typeof values[0] === 'number') {
          if (TIME_FILED_NAMES.includes(filedNames[i])) {
            fieldType = FieldType.time;
          } else {
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
      if (filedNames[i] !== 'pluginInfo') {
        let values = [result.data[filedNames[i]]];
        let fieldType = FieldType.string;
        if (typeof values === 'number') {
          if (TIME_FILED_NAMES.includes(filedNames[i])) {
            fieldType = FieldType.time;
          } else {
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
    let resultsparsed = result.content.map((row: any) => {
      return { text: row.name, value: row.id };
    });

    return resultsparsed;
  }

  async mapDataToSelect(result: any) {
    if (result === undefined || result === null) {
      return [];
    }
    let resultsparsed = result.map((row: any) => {
      return { label: row.name, value: row.id };
    });

    return resultsparsed;
  }
}
