import React from 'react';
import _, { defaults } from 'lodash';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from '../datasource';
import { MyDataSourceOptions, MyQuery, DEFAULT_QUERY } from '../types';

import QueryCategory from './categories/QueryCategory';
import Devices from './categories/Devices';

import Objects from './categories/Objects';
import Indicators from './categories/Indicators';
import IndicatorMetrics from './categories/Indicator Metrics';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export function QueryEditor({ query, onChange, datasource }: Props) {
  const updateQuery = (key: string, value: any) => {
    onChange({ ...query, [key]: value });
  };

  const queryWDefaults = defaults(query, DEFAULT_QUERY);
  const { selectedQueryCategory } = queryWDefaults;

  return (
    <>
      <QueryCategory query={query} updateQuery={updateQuery} datasource={datasource} isVariableEditor={false} />

      {selectedQueryCategory.value === 'Devices' && (
        <Devices query={query} updateQuery={updateQuery} datasource={datasource} />
      )}

      {selectedQueryCategory.value === 'Objects' && (
        <Objects query={query} updateQuery={updateQuery} datasource={datasource} />
      )}

      {selectedQueryCategory.value === 'Indicators' && (
        <Indicators query={query} updateQuery={updateQuery} datasource={datasource} />
      )}

      {selectedQueryCategory.value === 'IndicatorData' && (
        <IndicatorMetrics query={query} updateQuery={updateQuery} datasource={datasource} />
      )}
    </>
  );
}
