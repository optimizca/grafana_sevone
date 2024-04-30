import React from 'react';
import { SelectableValue } from '@grafana/data';
import { Select, InlineField, InlineFieldRow } from '@grafana/ui';
import { DataSource } from '../../datasource';

interface SubComponentProps {
  indicator: Array<SelectableValue<string>>;
  updateQuery: (key: string, value: any) => void;
  setIndicator: any;
  datasource: DataSource;
  device: Array<SelectableValue<string>>;
  object: Array<SelectableValue<string>>;
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
        results = await datasource.sevOneConnection.getIndicators(token, 3, device, object, 20, 0, '');
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
        <InlineField label="Indicator" labelWidth={20}>
          <Select
            width={80}
            options={indicatorOptions}
            defaultValue={indicator}
            value={indicator}
            isSearchable={true}
            isClearable={true}
            isMulti={true}
            backspaceRemovesValue={true}
            allowCustomValue={true}
            allowCreateWhileLoading={true}
            menuPlacement="auto"
            onCreateOption={(v) => {
              let newValue: Array<SelectableValue<string>> = [];
              if (indicator.length > 0) {
                newValue = [...indicator];
              }
              newValue.push({ label: v, value: v });
              updateQuery('indicator', newValue);
              setIndicator(newValue);
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
