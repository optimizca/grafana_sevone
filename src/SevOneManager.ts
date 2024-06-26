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
      return this.mapDataToDeviceSelect(results, true);
    } else {
      return this.mapDeviceToVariable(results);
    }
  }

  async getDevice(token: any, device: Array<SelectableValue<string>>, queryType: number, regexFilter: string) {
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
      results = this.applyVariableRegexFilter(results, regexFilter);
      return this.mapDeviceToVariable(results);
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

  async getDeviceOption(token: any, deviceIdentifiers: any[]): Promise<Array<SelectableValue<string>>> {
    let body: any = { ids: [], names: [] };
    deviceIdentifiers.forEach((deviceIdentifier) => {
      if (isNaN(+deviceIdentifier)) {
        // Value is a string or name of device
        body.names.push(deviceIdentifier);
      } else {
        // Value is a number or ID of device
        body.ids.push(+deviceIdentifier);
      }
    });
    if (body.ids.length === 0) {
      delete body.ids;
    } else if (body.names.length === 0) {
      delete body.names;
    }
    let url = `/api/v2/devices/filter`;
    let result: any = await this.postRequest(url, token, body);
    if (result.data.content.length === 0) {
      return [];
    }
    let finalResults: any[] = [];
    deviceIdentifiers.forEach((deviceIdentifier) => {
      if (isNaN(+deviceIdentifier)) {
        // Ensure result is exact match of object name provided in Grafana as the API does a contains search
        finalResults = finalResults.concat(
          result.data.content.filter((object: any) => object.name === deviceIdentifier)
        );
      } else {
        finalResults = finalResults.concat(
          result.data.content.filter((object: any) => object.id === +deviceIdentifier)
        );
      }
    });
    let deviceOptions: Array<SelectableValue<string>> = finalResults.map((finalResult) => {
      return { label: finalResult.name, value: finalResult.id };
    });
    return deviceOptions;
  }

  async getDevices(token: any, queryType: number, size: number, page: number, regexFilter: string) {
    let url = `/api/v2/devices?includeCount=false&page=${page}&size=${size}`;
    let data = await this.request(url, token);
    if (queryType === 0) {
      return data.data;
    } else if (queryType === 1) {
      return this.mapDataToFrame(data.data.content);
    } else if (queryType === 3) {
      return this.mapDataToDeviceSelect(data.data.content, true);
    } else {
      data.data.content = this.applyVariableRegexFilter(data.data.content, regexFilter);
      return this.mapDeviceToVariable(data.data.content);
    }
  }

  async getObjectOption(
    token: any,
    device: Array<SelectableValue<string>>,
    objectIdentifiers: any[]
  ): Promise<Array<SelectableValue<string>>> {
    let objectOptions: Array<SelectableValue<string>> = [];
    let body = { deviceIds: device.map((singleDevice) => singleDevice.value) };
    console.log('getObjectOption body: ', body);
    let url = `/api/v2/devices/objects/filter?page=${0}&size=${10000}&includeExtendedInfo=false&includeEnabledField=false`;
    let result: any = await this.postRequest(url, token, body);
    if (result.data.content.length === 0) {
      return [];
    }
    let finalResults: any[] = [];
    objectIdentifiers.forEach((objectIdentifier) => {
      if (isNaN(+objectIdentifier)) {
        // Ensure result is exact match of object name provided in Grafana as the API does a contains search
        finalResults = finalResults.concat(
          result.data.content.filter((object: any) => object.name === objectIdentifier)
        );
      } else {
        finalResults = finalResults.concat(
          result.data.content.filter((object: any) => object.id === +objectIdentifier)
        );
      }
    });

    // NEW Method
    // result.data.content.forEach((singleResult: any) => {
    //   let objectOption: SelectableValue<string> = {
    //     label: singleResult.name,
    //     value: singleResult.id,
    //   };
    //   objectOptions.push(objectOption);
    // });
    // return objectOptions;
    // OLD Method
    finalResults.forEach((singleResult: any) => {
      let matchingDevice = device.find((singleDevice: any) => singleDevice.value === singleResult.deviceId);
      let objectOption: SelectableValue<string> = {
        label: `${matchingDevice?.label}--${singleResult.name}`,
        value: singleResult.id,
      };
      objectOptions.push(objectOption);
    });
    return objectOptions;
  }

  async getObjects(
    token: any,
    queryType: number,
    device: Array<SelectableValue<string>>,
    deviceGroup: SelectableValue<string> | null,
    size: number,
    page: number,
    regexFilter: string
  ) {
    device = await this.translateDevice(device, token);
    deviceGroup = this.translateDeviceGroup(deviceGroup);
    const url = `/api/v2/devices/objects/filter?page=${page}&size=${size}&includeExtendedInfo=false&includeEnabledField=false`;
    let body: any = {};
    if (device.length > 0) {
      body.deviceIds = device.map((singleDevice: any) => parseInt(singleDevice.value, 10));
    } else {
      if (deviceGroup === null || typeof deviceGroup.value === 'undefined') {
        return [];
      }
      body.deviceGroupIds = [parseInt(deviceGroup.value, 10)];
    }
    const response = await this.postRequest(url, token, body);
    let results = response.data.content;
    if (queryType === 0) {
      return results;
    } else if (queryType === 1) {
      return this.mapDataToFrame(results);
    } else if (queryType === 3) {
      return this.mapObjectDataToSelect(results);
    } else {
      results = this.applyVariableRegexFilter(results, regexFilter);
      return this.mapObjectToVariable(results, device);
    }
  }

  async getIndicators(
    token: any,
    queryType: number,
    device: Array<SelectableValue<string>>,
    deviceGroup: SelectableValue<string> | null,
    object: Array<SelectableValue<string>>,
    size: number,
    page: number,
    regexFilter: string
  ) {
    device = await this.translateDevice(device, token);
    if (device.length === 0) {
      device = await this.getDeviceGroupMembers(token, 4, deviceGroup, '');
    }
    object = await this.translateObject(device, object, token);
    if (device.length === 0 || object.length === 0) {
      return [];
    }
    let body: any = { objectIds: [] };
    object.forEach((singleObject) => {
      let deviceLabel = singleObject.label?.substring(0, singleObject.label?.indexOf('--'));
      let matchingDevice: Array<SelectableValue<string>> = device.filter(
        (singleDevice) => singleDevice.label === deviceLabel
      );
      if (matchingDevice.length === 0) {
        return;
      }
      body.objectIds.push({ deviceId: matchingDevice[0].value, objectId: singleObject.value });
    });
    let url = `/api/v2/devices/objects/filter?page=${page}&size=${size}&includeExtendedInfo=false&includeEnabledField=false&includeIndicators=true`;
    let response = await this.postRequest(url, token, body);
    let tempResults = response.data.content.map((result: any) => {
      return result.indicators;
    });
    let results: any = [].concat(...tempResults);
    if (queryType === 0) {
      return results;
    } else if (queryType === 1) {
      return this.mapDataToFrame(results);
    } else if (queryType === 3) {
      return this.mapIndicatorDataToSelect(results);
    } else {
      results = this.applyVariableRegexFilter(results, regexFilter);
      return this.mapIndicatorToVariable(results, object);
    }
  }

  async getIndicatorOption(
    token: any,
    inputDevice: Array<SelectableValue<string>>,
    inputObject: Array<SelectableValue<string>>,
    indicatorIdentifiers: any[]
  ): Promise<Array<SelectableValue<string>>> {
    let results = await this.getIndicators(token, 0, inputDevice, null, inputObject, 100, 0, '');
    if (results.length === 0) {
      return [];
    }
    let foundIndicators: any[] = [];
    indicatorIdentifiers.forEach((indicatorIdentifier) => {
      if (isNaN(+indicatorIdentifier)) {
        // Value is a string or name of device
        foundIndicators = foundIndicators.concat(results.filter((result: any) => result.name === indicatorIdentifier));
      } else {
        // Value is a number or ID of device
        foundIndicators = foundIndicators.concat(results.filter((result: any) => result.id === +indicatorIdentifier));
      }
    });
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
    deviceGroup: SelectableValue<string> | null,
    object: Array<SelectableValue<string>>,
    indicator: Array<SelectableValue<string>>,
    starttime: number,
    endtime: number
  ) {
    device = await this.translateDevice(device, token);
    if (device.length === 0) {
      device = await this.getDeviceGroupMembers(token, 4, deviceGroup, '');
    }
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

  async getDeviceGroups(token: any, queryType: number, size: number, page: number, regexFilter: string) {
    let url = `/api/v2/devicegroups?includeMembers=false&page=${page}&size=${size}`;
    let response = await this.request(url, token);
    if (queryType === 1) {
      return this.mapDataToFrame(response.data.content);
    } else if (queryType === 3) {
      return this.mapDataToDeviceSelect(response.data.content, true);
    } else {
      response.data.content = this.applyVariableRegexFilter(response.data.content, regexFilter);
      return this.mapDeviceToVariable(response.data.content);
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
      return this.mapDataToDeviceSelect(results, true);
    } else {
      return this.mapDeviceToVariable(results);
    }
  }

  async getDeviceGroupMembers(
    token: any,
    queryType: number,
    deviceGroup: SelectableValue<string> | null,
    regexFilter: string
  ) {
    deviceGroup = this.translateDeviceGroup(deviceGroup);
    if (deviceGroup === null) {
      return [];
    }
    let url = `/api/v2/devicegroups/${deviceGroup.value}?includeMembers=true`;
    let response = await this.request(url, token);
    if (queryType === 1) {
      return this.mapDataToFrame(response.data.devices);
    } else if (queryType === 3) {
      return this.mapDataToDeviceSelect(response.data.devices, true);
    } else if (queryType === 4) {
      return this.mapDataToDeviceSelect(response.data.devices, false);
    } else {
      response.data.devices = this.applyVariableRegexFilter(response.data.devices, regexFilter);
      return this.mapDeviceToVariable(response.data.devices);
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
    filedNames = this.moveNameFieldToFirstPosition(filedNames);
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
    if (results.length === 0) {
      return [];
    }
    results = results.filter((result: any) => {
      const resultKey = Object.keys(result);
      if (result[resultKey[0]].length === 0) {
        return false;
      } else {
        return true;
      }
    });
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
    filedNames = this.moveNameFieldToFirstPosition(filedNames);
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

  async mapDeviceToVariable(result: any[]) {
    let resultsparsed = result.map((row: any) => {
      return { text: row.name, value: row.id };
    });

    return resultsparsed;
  }

  async mapObjectToVariable(result: any[], device: Array<SelectableValue<string>>) {
    if (result.length === 0) {
      return [];
    }
    let reformattedOptions: Array<SelectableValue<string>> = [];
    let existingOptions: any[] = [];
    result.forEach((res) => {
      if (!existingOptions.includes(res.name)) {
        reformattedOptions.push({ text: res.name, value: res.name });
        existingOptions.push(res.name);
      }
    });
    return reformattedOptions;
    // OLD Method which prepends extra data to the label
    // let resultsparsed = result.map((row: any) => {
    //   let matchingDevice = device.find((singleDevice: any) => singleDevice.value === row.deviceId);
    //   return { text: `${matchingDevice?.label}--${row.name}`, value: row.id };
    // });

    // return resultsparsed;
  }

  async mapIndicatorToVariable(result: any[], object: Array<SelectableValue<string>>) {
    if (result.length === 0) {
      return [];
    }
    let reformattedOptions: Array<SelectableValue<string>> = [];
    let existingOptions: any[] = [];
    result.forEach((res) => {
      if (!existingOptions.includes(res.name)) {
        reformattedOptions.push({ text: res.name, value: res.name });
        existingOptions.push(res.name);
      }
    });
    return reformattedOptions;
    // OLD Method which prepends extra data to the label
    // let resultsparsed = result.map((row: any) => {
    //   let matchingObject = object.find((singleObject: any) => singleObject.value === row.objectId);
    //   return { text: `${matchingObject?.label}--${row.name}`, value: row.id };
    // });
    // return resultsparsed;
  }

  async mapDataToDeviceSelect(result: any, addVariableOptions: boolean) {
    if (result === undefined || result === null) {
      return [];
    }
    let variableOptions = [];
    if (addVariableOptions === true) {
      const variables = getTemplateSrv().getVariables() as any;
      variableOptions = variables.map((variable: any) => {
        return { label: `$${variable.id}`, value: `$${variable.id}` };
      });
    }
    let resultsparsed = result.map((row: any) => {
      return { label: row.name, value: row.id };
    });
    const deviceSelectOptions = variableOptions.concat(resultsparsed);
    return deviceSelectOptions;
  }

  async mapObjectDataToSelect(result: any[]) {
    const addVariableOptions = true;
    if (result.length === 0) {
      return [];
    }
    let variableOptions = [];
    if (addVariableOptions === true) {
      const variables = getTemplateSrv().getVariables() as any;
      variableOptions = variables.map((variable: any) => {
        return { label: `$${variable.id}`, value: `$${variable.id}` };
      });
    }
    let reformattedOptions: Array<SelectableValue<string>> = [];
    let existingOptions: any[] = [];
    result.forEach((res) => {
      if (!existingOptions.includes(res.name)) {
        reformattedOptions.push({ label: res.name, value: res.name });
        existingOptions.push(res.name);
      }
    });
    let selectOptions = variableOptions.concat(reformattedOptions);
    return selectOptions;
    // OLD Method which prepends extra data to the label
    // let resultsparsed = result.map((row: any) => {
    //   let matchingDevice = device.find((singleDevice: any) => singleDevice.value === row.deviceId);
    //   // return { label: row.name, value: row.id, description: `device: ${device.name}` };
    //   return { label: `${matchingDevice?.label}--${row.name}`, value: row.id };
    // });

    // const variables = getTemplateSrv().getVariables() as any;
    // let variableOptions = variables.map((variable: any) => {
    //   return { label: `$${variable.id}`, value: `$${variable.id}` };
    // });

    // const objectSelectOptions = variableOptions.concat(resultsparsed);
    // return objectSelectOptions;
  }

  async mapIndicatorDataToSelect(result: any[]) {
    const addVariableOptions = true;
    if (result.length === 0) {
      return [];
    }
    let variableOptions = [];
    if (addVariableOptions === true) {
      const variables = getTemplateSrv().getVariables() as any;
      variableOptions = variables.map((variable: any) => {
        return { label: `$${variable.id}`, value: `$${variable.id}` };
      });
    }
    let reformattedOptions: Array<SelectableValue<string>> = [];
    let existingOptions: any[] = [];
    result.forEach((res) => {
      if (!existingOptions.includes(res.name)) {
        reformattedOptions.push({ label: res.name, value: res.name });
        existingOptions.push(res.name);
      }
    });
    let selectOptions = variableOptions.concat(reformattedOptions);
    return selectOptions;
    // OLD Method which prepends extra data to the label
    // let resultsparsed = result.map((row: any) => {
    //   let matchingObject = object.find((singleObject: any) => singleObject.value === row.objectId);
    //   return { label: `${matchingObject?.label}--${row.name}`, value: row.id };
    // });
    // const variables = getTemplateSrv().getVariables() as any;
    // let variableOptions = variables.map((variable: any) => {
    //   return { label: `$${variable.id}`, value: `$${variable.id}` };
    // });

    // const indicatorSelectOptions = variableOptions.concat(resultsparsed);
    // return indicatorSelectOptions;
  }

  getVariableValue(variableName: string) {
    const variables = getTemplateSrv().getVariables() as any;
    const variable = variables.find((v: any) => v.id === variableName);
    // console.log(`getVariableValue ${variableName}: `, variable);
    if (variable && typeof variable.current !== 'undefined') {
      if (variable.current.value.length > 0 && variable.current.value[0] === '$__all') {
        if (typeof variable.allValue !== 'undefined' && variable.allValue !== null) {
          // All Option selected and All Value provided
          return [variable.allValue];
        } else {
          // All Option selected so loop over all options in the variable except special All option
          return variable.options.filter((option: any) => option.value !== '$__all').map((option: any) => option.value);
        }
      }
      // All Option was not selected so we return either the single or multi value
      if (typeof variable.current.value === 'object') {
        return variable.current.value;
      } else {
        return [variable.current.value];
      }
    }
    // Couldn't find a variable with the name provided so we were given a non variable value and will return it
    return [variableName];
  }

  translateDeviceGroup(inputDeviceGroup: SelectableValue<string> | null) {
    if (
      inputDeviceGroup === null ||
      inputDeviceGroup.value === undefined ||
      typeof inputDeviceGroup.value !== 'string'
    ) {
      return inputDeviceGroup;
    }
    let deviceGroupBasedOnVariable: SelectableValue<string> = { label: '' };
    let variableName = inputDeviceGroup.value;
    if (variableName.indexOf('$') === 0) {
      variableName = inputDeviceGroup.value.substring(1);
    }
    let realValues = this.getVariableValue(variableName);
    if (realValues.length > 1) {
      // Handle multi-select variables
      // Not implemented on device groups for performance reasons
      console.error('Multi-value and all options are disabled for device groups');
      throw new Error('Multi-value and all options are disabled for device groups');
      return null;
    } else {
      // Handle single select variables
      // let deviceGroupBasedOnVariable: SelectableValue<string> = await this.getDeviceOption(token, realValues);
      // device.push(deviceGroupBasedOnVariable);
      deviceGroupBasedOnVariable.value = realValues[0];
    }
    return deviceGroupBasedOnVariable;
  }

  async translateDevice(inputDevice: Array<SelectableValue<string>>, token: any) {
    let device: Array<SelectableValue<string>> = [];
    for (const singleDevice of inputDevice) {
      if (singleDevice.value !== undefined) {
        if (typeof singleDevice.value === 'string') {
          let variableName = singleDevice.value;
          if (variableName.indexOf('$') === 0) {
            variableName = singleDevice.value.substring(1);
          }
          let realValues = this.getVariableValue(variableName);
          let devicesBasedOnVariable: Array<SelectableValue<string>> = await this.getDeviceOption(token, realValues);
          device = device.concat(devicesBasedOnVariable);
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
          let objectsBasedOnVariable: Array<SelectableValue<string>> = await this.getObjectOption(
            token,
            inputDevice,
            realValues
          );
          object = object.concat(objectsBasedOnVariable);
          // if (typeof realValues === 'object') {
          //   // Handle multi-select variables
          //   let objectsBasedOnVariable: Array<SelectableValue<string>> = [];
          //   for (const realValue of realValues) {
          //     let objectOption: Array<SelectableValue<string>> = await this.getObjectOption(
          //       token,
          //       inputDevice,
          //       realValue
          //     );
          //     objectsBasedOnVariable = objectsBasedOnVariable.concat(objectOption);
          //   }
          //   object = object.concat(objectsBasedOnVariable);
          // } else {
          //   // Handle single select variables
          //   let objectBasedOnVariable: Array<SelectableValue<string>> = await this.getObjectOption(
          //     token,
          //     inputDevice,
          //     realValues
          //   );
          //   object = object.concat(objectBasedOnVariable);
          // }
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
          let indicatorsBasedOnVariable: Array<SelectableValue<string>> = await this.getIndicatorOption(
            token,
            inputDevice,
            inputObject,
            realValues
          );
          indicator = indicator.concat(indicatorsBasedOnVariable);
          // if (typeof realValues === 'object') {
          //   // Handle multi-select variables
          //   let indicatorsBasedOnVariable: Array<SelectableValue<string>> = [];
          //   for (const realValue of realValues) {
          //     let indicatorOption: SelectableValue<string> = await this.getIndicatorOption(
          //       token,
          //       inputDevice,
          //       inputObject,
          //       realValue
          //     );
          //     indicatorsBasedOnVariable = indicatorsBasedOnVariable.concat(indicatorOption);
          //   }
          //   indicator = indicator.concat(indicatorsBasedOnVariable);
          // } else {
          //   // Handle single select variables
          //   let indicatorBasedOnVariable: SelectableValue<string> = await this.getIndicatorOption(
          //     token,
          //     inputDevice,
          //     inputObject,
          //     realValues
          //   );
          //   indicator = indicator.concat(indicatorBasedOnVariable);
          // }
        } else {
          // This option of the select was not a variable so it is returned as is
          indicator.push(singleIndicator);
        }
      }
    }
    return indicator;
  }

  moveNameFieldToFirstPosition(fields: string[]) {
    const nameIndex = fields.indexOf('name');
    if (nameIndex > 0) {
      fields.splice(nameIndex, 1);
      fields.unshift('name');
    }
    return fields;
  }

  applyVariableRegexFilter(results: any[], regexFilter: string) {
    if (regexFilter.length === 0) {
      return results;
    }
    const regex = new RegExp(regexFilter);
    results = results.filter((result) => result.name.match(regex));
    return results;
  }
}
