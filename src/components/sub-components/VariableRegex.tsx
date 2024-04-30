import React from 'react';
import { InlineField, InlineFieldRow, InlineSwitch, Input } from '@grafana/ui';
import { MyVariableQuery } from '../../types';

interface SubComponentProps {
  query: MyVariableQuery;
  updateQuery: (key: string, value: any) => void;
}

const VariableRegex: React.FC<SubComponentProps> = ({ query, updateQuery }) => {
  const [useRegexFilter, setUseRegexFilter] = React.useState<boolean>(query.useRegexFilter);
  const [regexFilter, setRegexFilter] = React.useState<string>(query.regexFilter);

  return (
    <>
      <InlineFieldRow>
        <InlineField label="Regex Filter" labelWidth={20}>
          <InlineSwitch
            value={useRegexFilter}
            onChange={(e: React.FormEvent<HTMLInputElement>) => {
              updateQuery('useRegexFilter', e.currentTarget.checked);
              setUseRegexFilter(e.currentTarget.checked);
            }}
          />
        </InlineField>
        {useRegexFilter === true && (
          <InlineField>
            <Input
              width={73}
              defaultValue={regexFilter}
              onBlur={(e: React.FormEvent<HTMLInputElement>) => {
                updateQuery('regexFilter', e.currentTarget.value);
                setRegexFilter(e.currentTarget.value);
              }}
            />
          </InlineField>
        )}
      </InlineFieldRow>
    </>
  );
};

export default VariableRegex;
