import React from 'react';
import { SelectableValue } from '@grafana/data';

import { DataSource } from '../../datasource';
import { MyQuery } from '../../types';
import Device from 'components/sub-components/Device';
import Object from 'components/sub-components/Object';
import Indicator from 'components/sub-components/Indicator';

interface SubComponentProps {
  query: MyQuery;
  updateQuery: (key: string, value: any) => void;
  datasource: DataSource;
}

const IndicatorMetrics: React.FC<SubComponentProps> = ({ query, updateQuery, datasource }) => {
  // console.log('Render Objects Category');

  const [device, setDevice] = React.useState<SelectableValue<string> | null>(query.device);
  const [object, setObject] = React.useState<SelectableValue<string> | null>(query.object);
  const [indicator, setIndicator] = React.useState<SelectableValue<string> | null>(query.indicator);

  return (
    <>
      <Device device={device} updateQuery={updateQuery} setDevice={setDevice} datasource={datasource} />
      <Object object={object} updateQuery={updateQuery} setObject={setObject} datasource={datasource} device={device} />
      <Indicator
        indicator={indicator}
        updateQuery={updateQuery}
        setIndicator={setIndicator}
        datasource={datasource}
        device={device}
        object={object}
      />
    </>
  );
};

export default IndicatorMetrics;
