import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  LoadingState,
  SelectableValue,
  DataSourceVariableSupport,
  VariableSupportType,
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

    let deviceID: Array<SelectableValue<string>> = [{ label: '', value: query.deviceID }];
    let objectID: Array<SelectableValue<string>> = [{ label: '', value: query.objectID }];
    let size = 20;
    let page = 0;

    if (typeof query.size === 'string') {
      if (query.size) {
        size = query.size;
      }
    }

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

      switch (queryType) {
        case 'Devices':
          if (deviceGroupID !== undefined && deviceGroupID !== null && target.device.length === 0) {
            return this.sevOneConnection.getDeviceGroupMembers(token, 1, deviceGroupID);
          } else if (target.device.length > 0) {
            return this.sevOneConnection.getDevice(token, target.device, 1);
          } else {
            return this.sevOneConnection.getDevices(token, 1, target.size, target.page);
          }
        case 'Objects':
          return this.sevOneConnection.getObjects(token, 1, target.device, target.size, target.page);
        case 'Indicators':
          return this.sevOneConnection.getIndicators(token, 1, target.device, target.object, target.size, target.page);
        case 'IndicatorData':
          return this.sevOneConnection.getIndicatorData(
            token,
            target.device,
            target.object,
            target.indicator,
            from,
            to
          );
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

export class MyDataSourceVariableSupport extends DataSourceVariableSupport<DataSource, MyQuery, MyDataSourceOptions> {
  getType(): VariableSupportType {
    return VariableSupportType.Datasource;
  }
}
