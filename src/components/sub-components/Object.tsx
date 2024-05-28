import React from 'react';
import { SelectableValue } from '@grafana/data';
import { Select, InlineField, InlineFieldRow } from '@grafana/ui';
import { DataSource } from '../../datasource';

interface SubComponentProps {
  object: Array<SelectableValue<string>>;
  updateQuery: (key: string, value: any) => void;
  setObject: any;
  datasource: DataSource;
  device: Array<SelectableValue<string>>;
  deviceGroup: SelectableValue<string> | null;
}

const Object: React.FC<SubComponentProps> = ({ object, updateQuery, setObject, datasource, device, deviceGroup }) => {
  const [objectOptions, setObjectOptions] = React.useState([{ label: 'Loading ...', value: '' }]);
  // console.log('render Object component');

  React.useEffect(() => {
    let unmounted = false;
    let results = [] as any;

    async function getObjectOptions() {
      try {
        let token = '';
        token = await datasource.getToken();
        results = await datasource.sevOneConnection.getObjects(token, 3, device, deviceGroup, 20, 0, '');
      } catch (err) {
        console.error('Error Loading Devices: ', err);
        results = [{ label: 'Error Loading Devices', value: '' }];
      }
      if (!unmounted) {
        setObjectOptions(results);
      }
    }
    getObjectOptions();
    return () => {
      unmounted = true;
    };
  }, [datasource, device, deviceGroup]);

  return (
    <div>
      <InlineFieldRow>
        <InlineField label="Object" labelWidth={20}>
          <Select
            width={80}
            options={objectOptions}
            defaultValue={object}
            value={object}
            isSearchable={true}
            isClearable={true}
            isMulti={true}
            backspaceRemovesValue={true}
            allowCustomValue={true}
            allowCreateWhileLoading={true}
            menuPlacement="auto"
            onCreateOption={(v) => {
              let newValue: Array<SelectableValue<string>> = [];
              if (object.length > 0) {
                newValue = [...object];
              }
              newValue.push({ label: v, value: v });
              updateQuery('object', newValue);
              setObject(newValue);
            }}
            onChange={(v) => {
              updateQuery('object', v);
              setObject(v);
            }}
          />
        </InlineField>
      </InlineFieldRow>
    </div>
  );
};

export default Object;
