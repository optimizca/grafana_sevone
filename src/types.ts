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
  size: 100,
  device: [],
  object: [],
  indicator: [],
  deviceGroup: null,
};

export interface MyVariableQuery extends MyQuery {
  useRegexFilter: boolean;
  regexFilter: string;
}

export const DEFAULT_VARIABLE_QUERY: Partial<MyVariableQuery> = {
  selectedQueryCategory: {
    label: 'Devices',
    value: 'Devices',
    description: 'Grab All Devices Info from SevOne',
  },
  page: 0,
  size: 100,
  device: [],
  object: [],
  indicator: [],
  deviceGroup: null,
  useRegexFilter: false,
  regexFilter: '',
};

// These are options configured for each DataSource instance
export interface MyDataSourceOptions extends DataSourceJsonData {
  url?: string;
  username?: string;
  tlsSkipVerify?: boolean;
}

// Value that is used in the backend, but never sent over HTTP to the frontend
export interface MySecureJsonData {
  password?: string;
}
