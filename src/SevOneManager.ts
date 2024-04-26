import _ from 'lodash';
import { MutableDataFrame, FieldType, SelectableValue } from '@grafana/data';
import { getBackendSrv, getTemplateSrv } from '@grafana/runtime';

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
    device = await this.translateDevice(device, token);
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

  // OLD
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

  async getDeviceOption(token: any, deviceIdentifier: any): Promise<SelectableValue<string>> {
    let body = {};
    if (isNaN(+deviceIdentifier)) {
      // Value is a string or name of device
      body = { name: deviceIdentifier };
    } else {
      // Value is a number or ID of device
      body = { ids: [+deviceIdentifier] };
    }
    let url = `/api/v2/devices/filter`;
    let result: any = await this.postRequest(url, token, body);
    if (result.data.content.length === 0) {
      return {};
    }
    let deviceOption: SelectableValue<string> = {
      label: result.data.content[0].name,
      value: result.data.content[0].id,
    };
    return deviceOption;
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
    device = await this.translateDevice(device, token);
    object = await this.translateObject(device, object, token);
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

  async getObjectOption(
    token: any,
    device: Array<SelectableValue<string>>,
    objectIdentifier: any
  ): Promise<Array<SelectableValue<string>>> {
    let objectOptions: Array<SelectableValue<string>> = [];
    let body = {};
    if (isNaN(+objectIdentifier)) {
      // Value is a string or name of device
      body = { name: objectIdentifier, deviceIds: device.map((singleDevice) => singleDevice.value) };
    } else {
      // Value is a number or ID of device
      body = {
        objectIds: device.map((singleDevice) => {
          return { objectId: objectIdentifier, deviceId: singleDevice.value };
        }),
      };
    }
    let url = `/api/v2/devices/objects/filter`;
    let result: any = await this.postRequest(url, token, body);
    if (result.data.content.length === 0) {
      return [];
    }
    if (isNaN(+objectIdentifier)) {
      // Ensure result is exact match of object name provided in Grafana as the API does a contains search
      result.data.content = result.data.content.filter((object: any) => object.name === objectIdentifier);
    }
    result.data.content.forEach((singleResult: any) => {
      let matchingDevice = device.find((singleDevice: any) => singleDevice.value === singleResult.deviceId);
      let objectOption: SelectableValue<string> = {
        label: `${matchingDevice?.label}--${singleResult.name}`,
        value: singleResult.id,
      };
      objectOptions.push(objectOption);
    });
    return objectOptions;
  }

  async getObjects(token: any, queryType: number, device: Array<SelectableValue<string>>, size: number, page: number) {
    device = await this.translateDevice(device, token);
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
    device = await this.translateDevice(device, token);
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
    device = await this.translateDevice(device, token);
    object = await this.translateObject(device, object, token);
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
      return this.mapIndicatorDataToSelect(results, device, object);
    } else {
      return this.mapDataToVariable(results);
    }
  }

  async getIndicatorOption(
    token: any,
    inputDevice: Array<SelectableValue<string>>,
    inputObject: Array<SelectableValue<string>>,
    indicatorIdentifier: any
  ): Promise<Array<SelectableValue<string>>> {
    let results = await this.getIndicators(token, 0, inputDevice, inputObject, 100, 0);
    if (results.length === 0) {
      return [];
    }
    let foundIndicators: any[] = [];
    if (isNaN(+indicatorIdentifier)) {
      // Value is a string or name of device
      foundIndicators = results.filter((result: any) => result.name === indicatorIdentifier);
    } else {
      // Value is a number or ID of device
      foundIndicators = results.filter((result: any) => result.id === +indicatorIdentifier);
    }
    let indicatorObjects: Array<SelectableValue<string>> = foundIndicators.map((foundIndicator) => {
      let matchingObject = inputObject.find((singleObject) => singleObject.value === foundIndicator.objectId);
      let indicatorObject: SelectableValue<string> = {
        label: `${matchingObject?.label}--${foundIndicator.name}`,
        value: foundIndicator.id,
      };
      return indicatorObject;
    });
    return indicatorObjects;
  }

  async getIndicatorData(
    token: any,
    device: Array<SelectableValue<string>>,
    object: Array<SelectableValue<string>>,
    indicator: Array<SelectableValue<string>>,
    starttime: number | undefined,
    endtime: number | undefined
  ) {
    device = await this.translateDevice(device, token);
    object = await this.translateObject(device, object, token);
    indicator = await this.translateIndicator(device, object, indicator, token);
    if (device.length === 0 || object.length === 0 || indicator.length === 0) {
      return [];
    }
    let responses: any[] = [];
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

  async mapIndicatorDataToSelect(
    result: any[],
    device: Array<SelectableValue<string>>,
    object: Array<SelectableValue<string>>
  ) {
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

    let resultsparsed = result.map((row: any) => {
      let matchingObject = object.find((singleObject: any) => singleObject.value === row.objectId);
      return { label: `${matchingObject?.label}--${row.name}`, value: row.id };
    });

    return resultsparsed;
  }

  getVariableValue(variableName: string) {
    const variables = getTemplateSrv().getVariables() as any;
    const variable = variables.find((v: any) => v.id === variableName);
    if (variable && typeof variable.current !== 'undefined') {
      if (variable.current.value.length > 0 && variable.current.value[0] === '$__all') {
        if (typeof variable.allValue !== 'undefined') {
          // All Option selected and All Value provided
          return variable.allValue;
        } else {
          // All Option selected so loop over all options in the variable except special All option
          return variable.options.filter((option: any) => option.value !== '$__all');
        }
      }
      // All Option was not selected so we return either the single or multi value
      return variable.current.value;
    }
    // Couldn't find a variable with the name provided so we were given a non variable value and will return it
    return variableName;
  }

  async translateDevice(inputDevice: Array<SelectableValue<string>>, token: any) {
    let device: Array<SelectableValue<string>> = [];
    for (const singleDevice of inputDevice) {
      if (singleDevice.value !== undefined) {
        if (typeof singleDevice.value === 'string') {
          let variableName = singleDevice.value.substring(1);
          let realValues = this.getVariableValue(variableName);
          if (typeof realValues === 'object') {
            // Handle multi-select variables
            let devicesBasedOnVariable: Array<SelectableValue<string>> = [];
            for (const realValue of realValues) {
              let deviceOption: SelectableValue<string> = await this.getDeviceOption(token, realValue);
              devicesBasedOnVariable.push(deviceOption);
            }
            device = device.concat(devicesBasedOnVariable);
          } else {
            // Handle single select variables
            let deviceBasedOnVariable: SelectableValue<string> = await this.getDeviceOption(token, realValues);
            device.push(deviceBasedOnVariable);
          }
        } else {
          // This option of the select was not a variable so it is returned as is
          device.push(singleDevice);
        }
      }
    }
    return device;
  }

  async translateObject(
    inputDevice: Array<SelectableValue<string>>,
    inputObject: Array<SelectableValue<string>>,
    token: any
  ) {
    let object: Array<SelectableValue<string>> = [];
    for (const singleObject of inputObject) {
      if (singleObject.value !== undefined) {
        if (typeof singleObject.value === 'string') {
          let variableName = singleObject.value;
          if (variableName.indexOf('$') === 0) {
            variableName = singleObject.value.substring(1);
          }
          let realValues = this.getVariableValue(variableName);
          if (typeof realValues === 'object') {
            // Handle multi-select variables
            let objectsBasedOnVariable: Array<SelectableValue<string>> = [];
            for (const realValue of realValues) {
              let objectOption: Array<SelectableValue<string>> = await this.getObjectOption(
                token,
                inputDevice,
                realValue
              );
              objectsBasedOnVariable = objectsBasedOnVariable.concat(objectOption);
            }
            object = object.concat(objectsBasedOnVariable);
          } else {
            // Handle single select variables
            let objectBasedOnVariable: Array<SelectableValue<string>> = await this.getObjectOption(
              token,
              inputDevice,
              realValues
            );
            object = object.concat(objectBasedOnVariable);
          }
        } else {
          // This option of the select was not a variable so it is returned as is
          object.push(singleObject);
        }
      }
    }
    return object;
  }

  async translateIndicator(
    inputDevice: Array<SelectableValue<string>>,
    inputObject: Array<SelectableValue<string>>,
    inputIndicator: Array<SelectableValue<string>>,
    token: any
  ) {
    let indicator: Array<SelectableValue<string>> = [];
    for (const singleIndicator of inputIndicator) {
      if (singleIndicator.value !== undefined) {
        if (typeof singleIndicator.value === 'string') {
          let variableName = singleIndicator.value;
          if (variableName.indexOf('$') === 0) {
            variableName = singleIndicator.value.substring(1);
          }
          let realValues = this.getVariableValue(variableName);
          if (typeof realValues === 'object') {
            // Handle multi-select variables
            let indicatorsBasedOnVariable: Array<SelectableValue<string>> = [];
            for (const realValue of realValues) {
              let indicatorOption: SelectableValue<string> = await this.getIndicatorOption(
                token,
                inputDevice,
                inputObject,
                realValue
              );
              indicatorsBasedOnVariable = indicatorsBasedOnVariable.concat(indicatorOption);
            }
            indicator = indicator.concat(indicatorsBasedOnVariable);
          } else {
            // Handle single select variables
            let indicatorBasedOnVariable: SelectableValue<string> = await this.getIndicatorOption(
              token,
              inputDevice,
              inputObject,
              realValues
            );
            indicator = indicator.concat(indicatorBasedOnVariable);
          }
        } else {
          // This option of the select was not a variable so it is returned as is
          indicator.push(singleIndicator);
        }
      }
    }
    return indicator;
  }
}
