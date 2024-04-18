import { DataSourceJsonData, SelectableValue } from '@grafana/data';
import { DataQuery } from '@grafana/schema';

export interface MyQuery extends DataQuery {
  selectedQueryCategory: SelectableValue<string>;
  deviceID: SelectableValue<number> | null; //DEPRECATED
  objectID: SelectableValue<number> | null; //DEPRECATED
  indicatorID: SelectableValue<number> | null; //DEPRECATED
  page: number;
  size: number;

  device: Array<SelectableValue<string>>;
  // TODO Turn Object and Indicator into multi-value select and Array types
  object: Array<SelectableValue<string>>;
  indicator: Array<SelectableValue<string>>;
  deviceGroup: SelectableValue<string> | null;
}

export const DEFAULT_QUERY: Partial<MyQuery> = {
  selectedQueryCategory: {
    label: 'Devices',
    value: 'Devices',
    description: 'Grab All Devices Info from SevOne',
  },
  page: 0,
  size: 20,
  device: [],
  object: [],
  indicator: [],
  deviceGroup: null,
};

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  url?: string;
  username?: string;
  tlsSkipVerify?: boolean;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {
  password?: string;
}

export interface MyVariableQuery {
  selectedQueryCategory: string;
  deviceID: string;
  objectID: string;
  page: number;
  size: number;
}
