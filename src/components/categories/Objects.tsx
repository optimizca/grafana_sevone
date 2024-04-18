import React from 'react';
import { SelectableValue } from '@grafana/data';

import { DataSource } from '../../datasource';
import { MyQuery } from '../../types';
import Device from 'components/sub-components/Device';
import Page from 'components/sub-components/Page';
import Size from 'components/sub-components/Size';
import DeviceGroup from 'components/sub-components/DeviceGroup';

interface SubComponentProps {
  query: MyQuery;
  updateQuery: (key: string, value: any) => void;
  datasource: DataSource;
}

const Objects: React.FC<SubComponentProps> = ({ query, updateQuery, datasource }) => {
  // console.log('Render Objects Category');

  const [deviceGroup, setDeviceGroup] = React.useState<SelectableValue<string> | null>(query.deviceGroup);
  const [device, setDevice] = React.useState<Array<SelectableValue<string>>>(query.device);
  const [size, setSize] = React.useState<number>(query.size);
  const [page, setPage] = React.useState<number>(query.page);

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
      <Size size={size} updateQuery={updateQuery} setSize={setSize} />
      <Page page={page} updateQuery={updateQuery} setPage={setPage} />
    </>
  );
};

export default Objects;
