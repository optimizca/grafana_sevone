import _ from 'lodash';
import { MutableDataFrame, FieldType, SelectableValue } from '@grafana/data';
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
    let results: any = [].concat(...responses);
    if (queryType === 0) {
      return results;
    } else if (queryType === 3) {
      return this.mapDataToSelect(results);
    } else {
      return this.mapDataToVariable(results);
    }
  }

  async getDevice(token: any, device: Array<SelectableValue<string>>, queryType: number) {
    if (device.length === 0) {
      return [];
    }
    // let url = `/api/v2/devices/${device[0].value}`;
    // let data = await this.request(url, token);
    let responses: any[] = [];
    device.forEach((singleDevice) => {
      let url = `/api/v2/devices/${singleDevice.value}`;
      responses.push(
        this.request(url, token).then((response) => {
          return response.data;
        })
      );
    });
    responses = await Promise.all(responses);
    let results: any[] = [].concat(...responses);
    if (queryType === 0) {
      return results;
    } else if (queryType === 1) {
      return this.mapDeviceDataToFrame(results);
    } else {
      return results;
    }
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
      return this.mapDataToVariable(data.data.content);
    }
  }

  async getObject(
    token: any,
    queryType: number,
    device: Array<SelectableValue<string>>,
    object: Array<SelectableValue<string>>
  ) {
    if (device.length === 0 || object.length === 0) {
      return [];
    }
    let responses: any[] = [];
    object.forEach((singleObject) => {
      let deviceLabel = singleObject.label?.substring(0, singleObject.label?.indexOf('--'));
      let matchingDevice: Array<SelectableValue<string>> = device.filter(
        (singleDevice) => singleDevice.label === deviceLabel
      );
      if (matchingDevice.length === 0) {
        return;
      }
      let url = `/api/v2/devices/${matchingDevice[0].value}/objects/${singleObject.value}`;
      responses.push(
        this.request(url, token)
          .then((response) => {
            return response.data;
          })
          .catch((e) => {
            console.log(e);
            return [];
          })
      );
    });
    responses = await Promise.all(responses);
    let results: any = [].concat(...responses);
    if (queryType === 0) {
      return results;
    } else {
      return this.mapDataToVariable(results);
    }
  }

  async getObjects(token: any, queryType: number, device: Array<SelectableValue<string>>, size: number, page: number) {
    if (device.length === 0) {
      return [];
    }
    let responses: any[] = [];
    device.forEach((singleDevice) => {
      let url = `/api/v2/devices/${singleDevice.value}/objects?page=${page}&size=${size}`;
      responses.push(
        this.request(url, token).then((response) => {
          return response.data.content;
        })
      );
    });
    responses = await Promise.all(responses);
    let results: any = [].concat(...responses);
    if (queryType === 0) {
      return results;
    } else if (queryType === 1) {
      return this.mapDataToFrame(results);
    } else if (queryType === 3) {
      return this.mapObjectDataToSelect(results, token);
    } else {
      return this.mapDataToVariable(results);
    }
  }

  async getObjectID(token: any, device: Array<SelectableValue<string>>, objectName: string) {
    if (device.length === 0) {
      return [];
    }
    let deviceIDs = device.map((singleDevice) => singleDevice.value);
    let url = `/api/v2/devices/objects/filter?includeExtendedInfo=false`;
    let body = { name: objectName, deviceIds: deviceIDs };
    let result: any = await this.postRequest(url, token, body);
    let objectIDs = result.data.content.map((singleObject: any) => singleObject.id);
    // let objectID = '0';
    // if (result.data.content && result.data.content.length > 0) {
    //   objectID = result.data.content[0].id;
    // }
    return objectIDs;
  }

  async getIndicators(
    token: any,
    queryType: number,
    device: Array<SelectableValue<string>>,
    object: Array<SelectableValue<string>>,
    size: number,
    page: number
  ) {
    if (device.length === 0 || object.length === 0) {
      return [];
    }
    // let url = `/api/v2/devices/${deviceId}/objects/${objectId}/indicators?page=${page}&size=${size}`;
    // let data = await this.request(url, token);
    let responses: any[] = [];
    object.forEach((singleObject) => {
      let deviceLabel = singleObject.label?.substring(0, singleObject.label?.indexOf('--'));
      let matchingDevice: Array<SelectableValue<string>> = device.filter(
        (singleDevice) => singleDevice.label === deviceLabel
      );
      if (matchingDevice.length === 0) {
        return;
      }
      let url = `/api/v2/devices/${matchingDevice[0].value}/objects/${singleObject.value}/indicators?page=${page}&size=${size}`;
      responses.push(
        this.request(url, token)
          .then((response) => {
            return response.data.content;
          })
          .catch((e) => {
            console.log(e);
            return [];
          })
      );
    });
    responses = await Promise.all(responses);
    let results: any = [].concat(...responses);
    if (queryType === 0) {
      return results;
    } else if (queryType === 1) {
      return this.mapDataToFrame(results);
    } else if (queryType === 3) {
      return this.mapIndicatorDataToSelect(results, token);
    } else {
      return this.mapDataToVariable(results);
    }
  }

  async getIndicatorData(
    token: any,
    device: Array<SelectableValue<string>>,
    object: Array<SelectableValue<string>>,
    indicator: Array<SelectableValue<string>>,
    starttime: number | undefined,
    endtime: number | undefined
  ) {
    if (device.length === 0 || object.length === 0 || indicator.length === 0) {
      return [];
    }
    let responses: any[] = [];
    // TODO Fix this mess
    indicator.forEach((singleIndicator) => {
      let objectLabel = singleIndicator.label?.substring(
        0,
        singleIndicator.label?.indexOf('--', singleIndicator.label?.indexOf('--') + 2)
      );
      let matchingObject: Array<SelectableValue<string>> = object.filter((singleObject: any) =>
        singleObject.label.includes(objectLabel)
      );

      let deviceLabel = objectLabel?.substring(0, objectLabel.indexOf('--'));
      let matchingDevice: Array<SelectableValue<string>> = device.filter(
        (singleDevice) => singleDevice.label === deviceLabel
      );

      if (matchingDevice.length === 0 || matchingObject.length === 0) {
        return;
      }
      let url = `/api/v2/devices/${matchingDevice[0].value}/objects/${matchingObject[0].value}/indicators/${singleIndicator.value}/data?endTime=${endtime}&startTime=${starttime}`;
      let key = `${singleIndicator.label}`;
      responses.push(
        this.request(url, token)
          .then((response) => {
            return { [key]: response.data };
          })
          .catch((e) => {
            console.log(e);
            return { [key]: [] };
          })
      );
    });
    responses = await Promise.all(responses);
    return this.mapIndicatorDataToFrame(responses);
  }

  async getDeviceGroups(token: any, queryType: number, size: number, page: number) {
    let url = `/api/v2/devicegroups?includeMembers=false&page=${page}&size=${size}`;
    let response = await this.request(url, token);
    if (queryType === 1) {
      return this.mapDataToFrame(response.data.content);
    } else if (queryType === 3) {
      return this.mapDataToSelect(response.data.content);
    } else {
      return this.mapDataToVariable(response.data.content);
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
    let results: any = [].concat(...responses);
    if (queryType === 1) {
      return this.mapDataToFrame(results);
    } else if (queryType === 3) {
      return this.mapDataToSelect(results);
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

  async mapIndicatorDataToFrame(results: any) {
    // const frame = new MutableDataFrame({
    //   fields: [],
    // });
    if (!(results.length > 0)) {
      return [];
    }
    const dataframes = results.map((result: any) => {
      const resultKey = Object.keys(result);
      const frame = new MutableDataFrame({
        fields: [],
        name: resultKey[0],
      });
      let resultArray = result[resultKey[0]];
      if (resultArray.length === 0) {
        return;
      }
      let filedNames = Object.keys(resultArray[0]);
      for (let i = 0; i < filedNames.length; i++) {
        if (filedNames[i] !== 'focus') {
          let values = resultArray.map((d: any) => d[filedNames[i]]);

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
    });

    return dataframes;
  }

  async mapDeviceDataToFrame(result: any) {
    const frame = new MutableDataFrame({
      fields: [],
    });
    let filedNames = Object.keys(result[0]);
    for (let i = 0; i < filedNames.length; i++) {
      if (filedNames[i] !== 'pluginInfo') {
        // let values = [result[filedNames[i]]];
        let values = result.map((d: any) => d[filedNames[i]]);
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
    let resultsparsed = result.map((row: any) => {
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

  async mapObjectDataToSelect(result: any[], token: any) {
    if (result.length === 0) {
      return [];
    }
    let deviceIDs: any[] = [];
    result.forEach((row: any) => {
      if (!deviceIDs.includes(row.deviceId)) {
        deviceIDs.push(row.deviceId);
      }
    });
    let deviceInput: Array<SelectableValue<string>> = deviceIDs.map((deviceID) => {
      let device: SelectableValue<string> = { value: deviceID, label: '' };
      return device;
    });
    let deviceInfo: any = await this.getDevice(token, deviceInput, 0);

    let resultsparsed = result.map((row: any) => {
      let device = deviceInfo.find((singleDevice: any) => singleDevice.id === row.deviceId);
      // return { label: row.name, value: row.id, description: `device: ${device.name}` };
      return { label: `${device.name}--${row.name}`, value: row.id };
    });

    return resultsparsed;
  }

  async mapIndicatorDataToSelect(result: any[], token: any) {
    if (result.length === 0) {
      return [];
    }
    let deviceIDs: any[] = [];
    let objectIDs: any[] = [];
    result.forEach((row: any) => {
      if (!deviceIDs.includes(row.deviceId)) {
        deviceIDs.push(row.deviceId);
      }
      if (!objectIDs.includes(row.objectId)) {
        objectIDs.push(row.objectId);
      }
    });

    let deviceInput: Array<SelectableValue<string>> = deviceIDs.map((deviceID) => {
      let device: SelectableValue<string> = { value: deviceID, label: '' };
      return device;
    });
    let deviceInfo: any = await this.getDevice(token, deviceInput, 0);

    let objectInput: Array<SelectableValue<string>> = objectIDs.map((objectID) => {
      let object: SelectableValue<string> = { value: objectID, label: '' };
      return object;
    });

    let objectInfo: any = await this.getObject(token, 0, deviceInput, objectInput);

    let resultsparsed = result.map((row: any) => {
      let device = deviceInfo.find((singleDevice: any) => singleDevice.id === row.deviceId);
      let object = objectInfo.find((singleObject: any) => singleObject.id === row.objectId);
      return { label: `${device.name}--${object.name}--${row.name}`, value: row.id };
    });

    return resultsparsed;
  }
}
