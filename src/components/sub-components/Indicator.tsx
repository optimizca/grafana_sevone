import React from 'react';
import { SelectableValue } from '@grafana/data';
import { Select, InlineField, InlineFieldRow } from '@grafana/ui';
import { DataSource } from '../../datasource';

interface SubComponentProps {
  indicator: SelectableValue<string> | null;
  updateQuery: (key: string, value: any) => void;
  setIndicator: any;
  datasource: DataSource;
  device: SelectableValue<string> | null;
  object: SelectableValue<string> | null;
}

const Indicator: React.FC<SubComponentProps> = ({
  indicator,
  updateQuery,
  setIndicator,
  datasource,
  device,
  object,
}) => {
  const [indicatorOptions, setIndicatorOptions] = React.useState([{ label: 'Loading ...', value: '' }]);
  // console.log('render Indicator component');

  React.useEffect(() => {
    let unmounted = false;
    let results = [] as any;

    async function getIndicatorOptions() {
      try {
        let token = '';
        token = await datasource.getToken();
        results = await datasource.sevOneConnection.getIndicators(token, 3, device?.value, object?.value, 20, 0);
      } catch (err) {
        console.error('Error Loading Devices: ', err);
        results = [{ label: 'Error Loading Devices', value: '' }];
      }
      if (!unmounted) {
        setIndicatorOptions(results);
      }
    }
    getIndicatorOptions();
    return () => {
      unmounted = true;
    };
  }, [datasource, device, object]);

  return (
    <div>
      <InlineFieldRow>
        <InlineField label="Indicator" labelWidth={15}>
          <Select
            width={30}
            options={indicatorOptions}
            defaultValue={indicator}
            value={indicator}
            isSearchable={true}
            isClearable={true}
            isMulti={false}
            backspaceRemovesValue={true}
            allowCustomValue={true}
            allowCreateWhileLoading={true}
            menuPlacement="auto"
            onCreateOption={(v) => {
              updateQuery('indicator', { label: v, value: v });
              setIndicator({ label: v, value: v });
            }}
            onChange={(v) => {
              updateQuery('indicator', v);
              setIndicator(v);
            }}
          />
        </InlineField>
      </InlineFieldRow>
    </div>
  );
};

export default Indicator;
