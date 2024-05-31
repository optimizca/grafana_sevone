import React from 'react';
import { InlineField, InlineFieldRow, Input } from '@grafana/ui';

interface SubComponentProps {
  size: number;
  updateQuery: (key: string, value: any) => void;
  setSize: any;
}

const Size: React.FC<SubComponentProps> = ({ size, updateQuery, setSize }) => {
  // console.log('render Size component');

  return (
    <div>
      <InlineFieldRow>
        <InlineField label="Size" labelWidth={20}>
          <Input
            type="number"
            width={20}
            defaultValue={size}
            onBlur={(e) => {
              updateQuery('size', parseInt(e.target.value, 10));
              setSize(parseInt(e.target.value, 10));
            }}
          />
        </InlineField>
      </InlineFieldRow>
    </div>
  );
};

export default Size;
