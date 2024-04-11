import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  LoadingState,
  SelectableValue,
} from '@grafana/data';

import _ from 'lodash';

import { MyQuery, MyDataSourceOptions, MyVariableQuery, DEFAULT_QUERY } from './types';

import { getBackendSrv, getTemplateSrv } from '@grafana/runtime';

import { SevOneManager } from 'SevOneManager';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  sevOneConnection: SevOneManager;
  url: string | undefined;
  username: string | undefined;
  password: string | undefined;
  dsProxyUrl: string | undefined;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    this.dsProxyUrl = instanceSettings.url;
    this.url = instanceSettings.jsonData.url;
    this.username = instanceSettings.jsonData.username;

    const connectionOptions = {
      dsProxyUrl: this.dsProxyUrl,
    };

    this.sevOneConnection = new SevOneManager(connectionOptions);
  }

  async metricFindQuery(query: MyVariableQuery, options?: any) {
    // Retrieve DataQueryResponse based on query.

    let token = '';
    let tokenResponse = this.getToken();
    await tokenResponse.then((response) => {
      token = response;
    });

    let queryType: string = query.selectedQueryCategory as string;

    let deviceID = '';

    if (query.deviceID) {
      deviceID = getTemplateSrv().replace(query.deviceID, options.scopedVars, 'csv');
      if (isNaN(+deviceID)) {
        deviceID = await this.sevOneConnection.getDeviceID(token, deviceID);
      }
    }

    let objectID = '';

    if (query.objectID) {
      objectID = getTemplateSrv().replace(query.objectID, options.scopedVars, 'csv');
      if (isNaN(+objectID)) {
        objectID = await this.sevOneConnection.getObjectID(token, deviceID, objectID);
      }
    }

    let size = 20;

    if (typeof query.size === 'string') {
      if (query.size) {
        size = query.size;
      }
    }

    let page = 0;

    if (typeof query.page === 'string') {
      if (query.page) {
        page = query.page;
      }
    }

    switch (queryType) {
      case 'Devices':
        if (query.page && query.size) {
          return this.sevOneConnection.getDevices(token, 2, size, page);
        } else {
          return this.sevOneConnection.getAllDevices(token, 1);
        }
      case 'Objects':
        if (query.deviceID) {
          return this.sevOneConnection.getObjects(token, 2, deviceID, size, page);
        } else {
          return [];
        }
      case 'Indicators':
        if (query.deviceID && query.objectID) {
          return this.sevOneConnection.getIndicators(token, 2, deviceID, objectID, size, page);
        } else {
          return [];
        }
      default:
        return [];
    }
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

      // console.log('==Target Logging Start==');
      // console.log(target);
      // console.log('==Target Logging End==');

      let queryType = DEFAULT_QUERY.selectedQueryCategory?.value;
      if (target.selectedQueryCategory !== undefined && target.selectedQueryCategory !== null) {
        queryType = target.selectedQueryCategory.value;
      }

      let deviceGroupID = target.deviceGroup?.value;

      if (
        target.deviceGroup !== undefined &&
        target.deviceGroup !== null &&
        typeof target.deviceGroup.value === 'string'
      ) {
        deviceGroupID = getTemplateSrv().replace(target.deviceGroup.value, options.scopedVars, 'csv');
        // TODO See if filter function is available for device groups to convert name into ID
        // if (isNaN(+deviceGroupID)) {
        //   deviceGroupID = await this.sevOneConnection.getDeviceID(token, deviceGroupID);
        // }
      }

      let device: Array<SelectableValue<string>> = [];
      target.device.forEach((singleDevice) => {
        let updatedSingleDevice = { ...singleDevice };
        if (typeof singleDevice.value === 'string') {
          updatedSingleDevice.value = getTemplateSrv().replace(singleDevice.value, options.scopedVars, 'csv');
        }
        device.push(updatedSingleDevice);
      });

      let objectID = target.object?.value;
      let object: any[] = [];

      if (target.object !== undefined && target.object !== null && typeof target.object.value === 'string') {
        objectID = getTemplateSrv().replace(target.object.value, options.scopedVars, 'csv');
        if (isNaN(+objectID)) {
          let oIDs = await this.sevOneConnection.getObjectID(token, device, objectID);
          object = object.concat(oIDs);
        }
      }
      console.log('object: ', object);

      let indicatorID = target.indicator?.value;

      if (target.indicator !== undefined && target.indicator !== null && typeof target.indicator.value === 'string') {
        indicatorID = getTemplateSrv().replace(target.indicator.value.toString(), options.scopedVars, 'csv');
        if (isNaN(+indicatorID)) {
          let indicatorData = this.sevOneConnection.getIndicators(token, 0, deviceID, objectID, 100, 0);
          await indicatorData.then((response) => {
            for (const indicator of response.content) {
              if (indicator.name === indicatorID) {
                indicatorID = indicator.id;
              }
            }
          });
        }
      }

      let size = 20;

      if (typeof target.size === 'string') {
        size = target.size;
      }

      let page = 0;

      if (typeof target.page === 'string') {
        page = target.page;
      }

      switch (queryType) {
        case 'Devices':
          if (deviceGroupID !== undefined && deviceGroupID !== null && device.length === 0) {
            return this.sevOneConnection.getDeviceGroupMembers(token, 1, deviceGroupID);
          } else if (device.length > 0) {
            return this.sevOneConnection.getDevice(token, device);
          } else {
            return this.sevOneConnection.getDevices(token, 1, size, page);
          }
        case 'Objects':
          return this.sevOneConnection.getObjects(token, 1, device, size, page);
        case 'Indicators':
          return this.sevOneConnection.getIndicators(token, 1, deviceID, objectID, size, page);
        case 'IndicatorData':
          return this.sevOneConnection.getIndicatorData(token, deviceID, objectID, indicatorID, from, to);
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
    await this.getToken();

    return {
      status: 'success',
      message: 'Success',
    };
  }

  async getToken() {
    if (this.url?.slice(-1) === '/') {
      throw new Error('Please remove the trailing / from your URL and try again');
    }
    let token = '';
    let url = this.dsProxyUrl + '/authenticate';

    const result = await getBackendSrv().datasourceRequest({
      url: url,
      method: 'POST',
    });
    token = result?.data.token || '';
    return token;
  }
}
