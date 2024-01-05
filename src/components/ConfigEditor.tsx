import React from 'react';
import { InlineField, Input, SecretInput } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions, MySecureJsonData } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions, MySecureJsonData> {}

export function ConfigEditor(props: Props) {
  const { onOptionsChange, options } = props;

  const onChangeJsonData = (key: any, value: any) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        [key]: value
      },
    });
  };

  const onResetSecurePassword = () => {
    onOptionsChange({
      ...options,
      secureJsonData: {
        password: '',
      },
      secureJsonFields: {
        password: false
      }
    });
  };

  const onChangeSecurePassword = (value: any) => {
    onOptionsChange({
      ...options,
      secureJsonData: {
        password: value,
      },
      secureJsonFields: {
        password: true
      }
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
      <InlineField label="Password" labelWidth={12}>
        <SecretInput
          isConfigured={options.secureJsonFields && options.secureJsonFields.password}
          placeholder="Password"
          width={40}
          onReset={onResetSecurePassword}
          onBlur={(e: any) => {
            onChangeSecurePassword(e.target.value);
          }}
        />
      </InlineField>
    </div>
  );
}
