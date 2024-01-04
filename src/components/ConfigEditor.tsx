import React from 'react';
import { InlineField, Input, SecretInput } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

export function ConfigEditor(props: Props) {
  const { onOptionsChange, options } = props;

  const onChangeJsonData = (key: any, value: any) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        [key]: value,
      },
    });
  };

  const onResetClientSecret = () => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        password: '',
        passwordSecretActive: false,
      },
    });
  };

  const onChangeClientSecret = (key: any, value: any) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        [key]: value,
        passwordSecretActive: true,
      },
    });
  };

  const { jsonData } = options;

  return (
    <div className="gf-form-group">
      <InlineField label="URL" labelWidth={12}>
        <Input
          onChange={(e: any) => {
            onChangeJsonData('url', e.target.value);
          }}
          value={jsonData.url || ''}
          placeholder="URL"
          width={40}
        />
      </InlineField>
      <InlineField label="Username" labelWidth={12}>
        <Input
          onChange={(e: any) => {
            onChangeJsonData('username', e.target.value);
          }}
          value={jsonData.username || ''}
          placeholder="Username"
          width={40}
        />
      </InlineField>
      <InlineField label="Password" labelWidth={16}>
        <SecretInput
          isConfigured={options.jsonData && options.jsonData.passwordSecretActive}
          value={options.jsonData.password || ''}
          placeholder="Password"
          width={40}
          onReset={onResetClientSecret}
          onBlur={(e: any) => {
            onChangeClientSecret('password', e.target.value);
          }}
        />
      </InlineField>
    </div>
  );
}
