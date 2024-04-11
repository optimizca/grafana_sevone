import React from 'react';
import { SelectableValue } from '@grafana/data';
import { Select, InlineField, InlineFieldRow } from '@grafana/ui';
import { DataSource } from '../../datasource';

interface SubComponentProps {
  deviceGroup: SelectableValue<string> | null;
  updateQuery: (key: string, value: any) => void;
  setDeviceGroup: any;
  datasource: DataSource;
}

const DeviceGroup: React.FC<SubComponentProps> = ({ deviceGroup, updateQuery, setDeviceGroup, datasource }) => {
  const [deviceGroupOptions, setDeviceGroupOptions] = React.useState([{ label: 'Loading ...', value: '' }]);
  const [originalDeviceGroupOptions, setOriginalDeviceGroupOptions] = React.useState([
    { label: 'Loading ...', value: '' },
  ]);
  const [allDeviceGroupOptions, setAllDeviceGroupOptions] = React.useState([{ label: 'Loading ...', value: '' }]);
  // console.log('render Device Group component');

  React.useEffect(() => {
    let unmounted = false;
    let results = [] as any;
    let allResults = [] as any;

    async function getDeviceGroupOptions() {
      try {
        let token = '';
        token = await datasource.getToken();
        results = await datasource.sevOneConnection.getDeviceGroups(token, 3, 20, 0);
        allResults = await datasource.sevOneConnection.getAllDeviceGroups(token, 3);
      } catch (err) {
        console.error('Error Loading Devices: ', err);
        results = [{ label: 'Error Loading Devices', value: '' }];
      }
      if (!unmounted) {
        setDeviceGroupOptions(results);
        setOriginalDeviceGroupOptions(results);
        setAllDeviceGroupOptions(allResults);
      }
    }
    getDeviceGroupOptions();
    return () => {
      unmounted = true;
    };
  }, [datasource]);

  const filterOptions = (value: string) => {
    // const timerStart = Date.now();
    let count = 0;
    const results = allDeviceGroupOptions.filter((deviceGroup: any) => {
      if (count < 20) {
        if (deviceGroup.label.toLowerCase().includes(value.toLowerCase())) {
          count++;
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    });
    setDeviceGroupOptions(results);
    // const timerEnd = Date.now();
    // const completionTime = timerEnd - timerStart;
    // console.log('==filterOptions v1 Took ' + completionTime + 'ms');
  };

  return (
    <div>
      <InlineFieldRow>
        <InlineField label="Device Group (Optional)" labelWidth={20}>
          <Select
            width={30}
            options={deviceGroupOptions}
            defaultValue={deviceGroup}
            value={deviceGroup}
            isSearchable={true}
            isClearable={true}
            isMulti={false}
            backspaceRemovesValue={true}
            allowCustomValue={true}
            allowCreateWhileLoading={true}
            menuPlacement="auto"
            onCreateOption={(v) => {
              updateQuery('deviceGroup', { label: v, value: v });
              setDeviceGroup({ label: v, value: v });
            }}
            onChange={(v) => {
              updateQuery('deviceGroup', v);
              setDeviceGroup(v);
            }}
            onInputChange={(v) => {
              if (v) {
                filterOptions(v);
              } else {
                setDeviceGroupOptions(originalDeviceGroupOptions);
              }
            }}
          />
        </InlineField>
      </InlineFieldRow>
    </div>
  );
};

export default DeviceGroup;
