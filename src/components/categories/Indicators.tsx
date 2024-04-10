import React from 'react';
import { SelectableValue } from '@grafana/data';

import { DataSource } from '../../datasource';
import { MyQuery } from '../../types';
import Device from 'components/sub-components/Device';
import Page from 'components/sub-components/Page';
import Size from 'components/sub-components/Size';
import Object from 'components/sub-components/Object';

interface SubComponentProps {
  query: MyQuery;
  updateQuery: (key: string, value: any) => void;
  datasource: DataSource;
}

const Indicators: React.FC<SubComponentProps> = ({ query, updateQuery, datasource }) => {
  // console.log('Render Objects Category');

  const [device, setDevice] = React.useState<SelectableValue<string> | null>(query.device);
  const [object, setObject] = React.useState<SelectableValue<string> | null>(query.object);
  const [size, setSize] = React.useState<number>(query.size);
  const [page, setPage] = React.useState<number>(query.page);

  return (
    <>
      <Device device={device} updateQuery={updateQuery} setDevice={setDevice} datasource={datasource} />
      <Object object={object} updateQuery={updateQuery} setObject={setObject} datasource={datasource} device={device} />
      <Size size={size} updateQuery={updateQuery} setSize={setSize} />
      <Page page={page} updateQuery={updateQuery} setPage={setPage} />
    </>
  );
};

export default Indicators;