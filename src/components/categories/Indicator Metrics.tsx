import React from 'react';
import { SelectableValue } from '@grafana/data';

import { DataSource } from '../../datasource';
import { MyQuery } from '../../types';
import Device from 'components/sub-components/Device';
import Object from 'components/sub-components/Object';
import Indicator from 'components/sub-components/Indicator';
import DeviceGroup from 'components/sub-components/DeviceGroup';

interface SubComponentProps {
  query: MyQuery;
  updateQuery: (key: string, value: any) => void;
  datasource: DataSource;
}

const IndicatorMetrics: React.FC<SubComponentProps> = ({ query, updateQuery, datasource }) => {
  // console.log('Render Objects Category');

  const [deviceGroup, setDeviceGroup] = React.useState<SelectableValue<string> | null>(query.deviceGroup);
  const [device, setDevice] = React.useState<Array<SelectableValue<string>>>(query.device);
  const [object, setObject] = React.useState<Array<SelectableValue<string>>>(query.object);
  const [indicator, setIndicator] = React.useState<Array<SelectableValue<string>>>(query.indicator);

  return (
    <>
      <DeviceGroup
        deviceGroup={deviceGroup}
        updateQuery={updateQuery}
        setDeviceGroup={setDeviceGroup}
        datasource={datasource}
      />
      <Device
        device={device}
        updateQuery={updateQuery}
        setDevice={setDevice}
        datasource={datasource}
        deviceGroup={deviceGroup}
      />
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
