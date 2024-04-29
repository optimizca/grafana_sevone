import React from 'react';
import _, { defaults } from 'lodash';
import { MyVariableQuery, DEFAULT_QUERY } from '../types';
import { DataSource } from '../datasource';

import QueryCategory from './categories/QueryCategory';
import Devices from './categories/Devices';
import Objects from './categories/Objects';
import Indicators from './categories/Indicators';

interface VariableQueryProps {
  query: MyVariableQuery;
  onChange: (query: MyVariableQuery, definition: string) => void;
  datasource: DataSource;
}

export const VariableQueryEditor = ({ onChange, query, datasource }: VariableQueryProps) => {
  const queryWDefaults = defaults(query, DEFAULT_QUERY);
  const { selectedQueryCategory } = queryWDefaults;

  const updateQuery = (key: string, value: any) => {
    const newQuery: MyVariableQuery = { ...queryWDefaults, [key]: value };
    onChange(newQuery, `${newQuery.selectedQueryCategory?.value}`);
  };

  return (
    <>
      <QueryCategory query={query} updateQuery={updateQuery} datasource={datasource} isVariableEditor={true} />

      {selectedQueryCategory.value === 'Devices' && (
        <Devices query={query} updateQuery={updateQuery} datasource={datasource} />
      )}

      {selectedQueryCategory.value === 'Objects' && (
        <Objects query={query} updateQuery={updateQuery} datasource={datasource} />
      )}

      {selectedQueryCategory.value === 'Indicators' && (
        <Indicators query={query} updateQuery={updateQuery} datasource={datasource} />
      )}
    </>
  );
};
