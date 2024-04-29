import React from 'react';
import { InlineFieldRow, InlineField, Select } from '@grafana/ui';
import { DataSource } from '../../datasource';
import { MyQuery } from '../../types';

interface SubComponentProps {
  query: MyQuery;
  updateQuery: (key: string, value: any) => void;
  datasource: DataSource;
  isVariableEditor: boolean;
}

const QueryCategory: React.FC<SubComponentProps> = ({ query, updateQuery, datasource, isVariableEditor }) => {
  // console.log('render Query Category component');

  const [selectedQueryCategory, setSelectedQueryCategory] = React.useState(query.selectedQueryCategory);

  let queryOptions = [
    {
      label: 'Devices',
      value: 'Devices',
      description: 'Grab All Devices Info from SevOne',
    },
    {
      label: 'Objects',
      value: 'Objects',
      description: 'Grab All Objects Info from SevOne',
    },
    {
      label: 'Indicators',
      value: 'Indicators',
      description: 'Grab All Indicators Info from SevOne',
    },
    {
      label: 'Indicator Metric',
      value: 'IndicatorData',
      description: 'Grab the Indicator Metric from SevOne',
    },
  ];

  if (isVariableEditor === true) {
    queryOptions = queryOptions.filter((option) => option.value !== 'IndicatorData');
  }

  return (
    <div>
      <InlineFieldRow>
        <InlineField label="Query Type" labelWidth={20}>
          <Select
            width={30}
            options={queryOptions}
            value={selectedQueryCategory}
            defaultValue={selectedQueryCategory}
            isSearchable={true}
            isClearable={false}
            isMulti={false}
            backspaceRemovesValue={false}
            allowCustomValue={false}
            menuPlacement="auto"
            onChange={(v) => {
              updateQuery('selectedQueryCategory', v);
              setSelectedQueryCategory(v);
            }}
          />
        </InlineField>
      </InlineFieldRow>
    </div>
  );
};

export default QueryCategory;
