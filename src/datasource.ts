import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  LoadingState,
  DataSourceVariableSupport,
  VariableSupportType,
  MetricFindValue,
} from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import _, { defaults, mergeWith } from 'lodash';
import { MyQuery, MyDataSourceOptions, DEFAULT_QUERY, MyVariableQuery, DEFAULT_VARIABLE_QUERY } from './types';
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

  customizer(objValue: any, srcValue: any) {
    return objValue === undefined ? srcValue : objValue;
  }

  applyDefaults(query: Partial<MyVariableQuery>): MyVariableQuery {
    return mergeWith({}, query, DEFAULT_VARIABLE_QUERY, this.customizer) as MyVariableQuery;
  }

  async metricFindQuery(query: Partial<MyVariableQuery>, options: any): Promise<MetricFindValue[]> {
    // Retrieve DataQueryResponse based on query.
    let queryWDefaults = this.applyDefaults(query);

    let token = '';
    let tokenResponse = this.getToken();
    await tokenResponse.then((response) => {
      token = response;
    });

    let regexFilter = queryWDefaults.regexFilter;
    if (queryWDefaults.useRegexFilter === false) {
      regexFilter = '';
    }

    switch (queryWDefaults.selectedQueryCategory.value) {
      case 'DeviceGroups':
        return this.sevOneConnection.getDeviceGroups(token, 2, queryWDefaults.size, queryWDefaults.page, regexFilter);
      case 'Devices':
        if (queryWDefaults.device.length === 0 && queryWDefaults.deviceGroup !== null) {
          console.log('BSR Variable queryWDefaults.deviceGroup: ', queryWDefaults.deviceGroup);
          return this.sevOneConnection.getDeviceGroupMembers(token, 2, queryWDefaults.deviceGroup, regexFilter);
        } else if (queryWDefaults.device.length > 0) {
          return this.sevOneConnection.getDevice(token, queryWDefaults.device, 2, regexFilter) as any;
        } else {
          return this.sevOneConnection.getDevices(token, 2, queryWDefaults.size, queryWDefaults.page, regexFilter);
        }
      case 'Objects':
        return this.sevOneConnection.getObjects(
          token,
          2,
          queryWDefaults.device,
          queryWDefaults.deviceGroup,
          queryWDefaults.size,
          queryWDefaults.page,
          regexFilter
        );
      case 'Indicators':
        return this.sevOneConnection.getIndicators(
          token,
          2,
          queryWDefaults.device,
          queryWDefaults.deviceGroup,
          queryWDefaults.object,
          queryWDefaults.size,
          queryWDefaults.page,
          regexFilter
        );
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
      console.log('==Target Logging Start==');
      console.log(target);
      console.log('==Target Logging End==');
      target = defaults(target, DEFAULT_QUERY);

      console.log('==Defaulted Target Logging Start==');
      console.log(target);
      console.log('==Defaulted Target Logging End==');

      switch (target.selectedQueryCategory.value) {
        case 'DeviceGroups':
          return this.sevOneConnection.getDeviceGroups(token, 1, target.size, target.page, '');
        case 'Devices':
          if (target.device.length === 0 && target.deviceGroup !== null) {
            return this.sevOneConnection.getDeviceGroupMembers(token, 1, target.deviceGroup, '');
          } else if (target.device.length > 0) {
            return this.sevOneConnection.getDevice(token, target.device, 1, '');
          } else {
            return this.sevOneConnection.getDevices(token, 1, target.size, target.page, '');
          }
        case 'Objects':
          return this.sevOneConnection.getObjects(
            token,
            1,
            target.device,
            target.deviceGroup,
            target.size,
            target.page,
            ''
          );
        case 'Indicators':
          return this.sevOneConnection.getIndicators(
            token,
            1,
            target.device,
            target.deviceGroup,
            target.object,
            target.size,
            target.page,
            ''
          );
        case 'IndicatorData':
          return this.sevOneConnection.getIndicatorData(
            token,
            target.device,
            target.deviceGroup,
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
