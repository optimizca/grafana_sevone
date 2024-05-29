import React from 'react';

import { DataSource } from '../../datasource';
import { MyQuery } from '../../types';
import Page from 'components/sub-components/Page';
import Size from 'components/sub-components/Size';

interface SubComponentProps {
  query: MyQuery;
  updateQuery: (key: string, value: any) => void;
  datasource: DataSource;
}

const DeviceGroups: React.FC<SubComponentProps> = ({ query, updateQuery, datasource }) => {
  // console.log('Render Devices Category');
  const [size, setSize] = React.useState<number>(query.size);
  const [page, setPage] = React.useState<number>(query.page);

  return (
    <>
      <Size size={size} updateQuery={updateQuery} setSize={setSize} />
      <Page page={page} updateQuery={updateQuery} setPage={setPage} />
    </>
  );
};

export default DeviceGroups;
