import { DataQuery, DataSourceJsonData, SelectableValue  } from '@grafana/data';

export interface MyQuery extends DataQuery {
  selectedQueryCategory: SelectableValue<string>;
  deviceID: SelectableValue<number> | null;
  objectID: SelectableValue<number> | null;
  indicatorID: SelectableValue<number> | null;
  page: number;
  size: number;
}

export const DEFAULT_QUERY: Partial<MyQuery> = {
  selectedQueryCategory: {
    label: 'Application Overview',
    value: 'Application_Overview',
    description: 'Grab Application Overview',
  },
  deviceID: {},
  objectID: {},
  indicatorID: {},
  page: 0,
  size: 20,
};

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  url?: string;
  username?: string;
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
