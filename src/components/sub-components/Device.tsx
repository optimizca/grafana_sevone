import React from 'react';
import { SelectableValue } from '@grafana/data';
import { Select, InlineField, InlineFieldRow } from '@grafana/ui';
import { DataSource } from '../../datasource';

interface SubComponentProps {
  device: SelectableValue<string> | null;
  updateQuery: (key: string, value: any) => void;
  setDevice: any;
  datasource: DataSource;
}

const Device: React.FC<SubComponentProps> = ({ device, updateQuery, setDevice, datasource }) => {
  const [deviceOptions, setDeviceOptions] = React.useState([{ label: 'Loading ...', value: '' }]);
  const [originalDeviceOptions, setOriginalDeviceOptions] = React.useState([{ label: 'Loading ...', value: '' }]);
  const [allDeviceOptions, setAllDeviceOptions] = React.useState([{ label: 'Loading ...', value: '' }]);
  // console.log('render Device component');

  React.useEffect(() => {
    let unmounted = false;
    let results = [] as any;
    let allResults = [] as any;

    async function getDeviceOptions() {
      try {
        let token = '';
        token = await datasource.getToken();
        results = await datasource.sevOneConnection.getDevices(token, 3, 20, 0);
        allResults = await datasource.sevOneConnection.getAllDevices(token, 3);
      } catch (err) {
        console.error('Error Loading Devices: ', err);
        results = [{ label: 'Error Loading Devices', value: '' }];
      }
      if (!unmounted) {
        setDeviceOptions(results);
        setOriginalDeviceOptions(results);
        setAllDeviceOptions(allResults);
      }
    }
    getDeviceOptions();
    return () => {
      unmounted = true;
    };
  }, [datasource]);

  const filterOptions = (value: string) => {
    // const timerStart = Date.now();
    let count = 0;
    const results = allDeviceOptions.filter((device: any) => {
      if (count < 20) {
        if (device.label.toLowerCase().includes(value?.toLowerCase())) {
          count++;
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    });
    setDeviceOptions(results);
    // const timerEnd = Date.now();
    // const completionTime = timerEnd - timerStart;
    // console.log('==filterOptions v1 Took ' + completionTime + 'ms');
  };

  return (
    <div>
      <InlineFieldRow>
        <InlineField label="Device" labelWidth={15}>
          <Select
            width={30}
            options={deviceOptions}
            defaultValue={device}
            value={device}
            isSearchable={true}
            isClearable={true}
            isMulti={false}
            backspaceRemovesValue={true}
            allowCustomValue={true}
            allowCreateWhileLoading={true}
            menuPlacement="auto"
            onCreateOption={(v) => {
              updateQuery('device', { label: v, value: v });
              setDevice({ label: v, value: v });
            }}
            onChange={(v) => {
              updateQuery('device', v);
              setDevice(v);
            }}
            onInputChange={(v) => {
              if (v) {
                filterOptions(v);
              } else {
                setDeviceOptions(originalDeviceOptions);
              }
            }}
          />
        </InlineField>
      </InlineFieldRow>
    </div>
  );
};

export default Device;
