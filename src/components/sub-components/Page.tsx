import React from 'react';
import { InlineField, InlineFieldRow, Input } from '@grafana/ui';

interface SubComponentProps {
  page: number;
  updateQuery: (key: string, value: any) => void;
  setPage: any;
}

const Page: React.FC<SubComponentProps> = ({ page, updateQuery, setPage }) => {
  // console.log('render Page component');

  return (
    <div>
      <InlineFieldRow>
        <InlineField label="Page" labelWidth={20}>
          <Input
            type="number"
            width={20}
            defaultValue={page}
            onBlur={(e) => {
              updateQuery('page', e.target.value);
              setPage(e.target.value);
            }}
          />
        </InlineField>
      </InlineFieldRow>
    </div>
  );
};

export default Page;
