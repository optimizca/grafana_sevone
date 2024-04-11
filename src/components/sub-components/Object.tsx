import React from 'react';
import { SelectableValue } from '@grafana/data';
import { Select, InlineField, InlineFieldRow } from '@grafana/ui';
import { DataSource } from '../../datasource';

interface SubComponentProps {
  object: SelectableValue<string> | null;
  updateQuery: (key: string, value: any) => void;
  setObject: any;
  datasource: DataSource;
  device: Array<SelectableValue<string>>;
}

const Object: React.FC<SubComponentProps> = ({ object, updateQuery, setObject, datasource, device }) => {
  const [objectOptions, setObjectOptions] = React.useState([{ label: 'Loading ...', value: '' }]);
  // console.log('render Object component');

  React.useEffect(() => {
    let unmounted = false;
    let results = [] as any;

    async function getObjectOptions() {
      try {
        let token = '';
        token = await datasource.getToken();
        results = await datasource.sevOneConnection.getObjects(token, 3, device, 20, 0);
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
  }, [datasource, device]);

  return (
    <div>
      <InlineFieldRow>
        <InlineField label="Object" labelWidth={20}>
          <Select
            width={30}
            options={objectOptions}
            defaultValue={object}
            value={object}
            isSearchable={true}
            isClearable={true}
            isMulti={false}
            backspaceRemovesValue={true}
            allowCustomValue={true}
            allowCreateWhileLoading={true}
            menuPlacement="auto"
            onCreateOption={(v) => {
              updateQuery('object', { label: v, value: v });
              setObject({ label: v, value: v });
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
