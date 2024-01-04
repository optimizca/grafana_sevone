import React, { useState } from 'react';
import { MyVariableQuery } from '../types';
import { InlineFieldRow, InlineField, Select, Input, VerticalGroup } from '@grafana/ui';

interface VariableQueryProps {
  query: MyVariableQuery;
  onChange: (query: MyVariableQuery, definition: string) => void;
}

export const VariableQueryEditor = ({ onChange, query }: VariableQueryProps) => {
  const [state, setState] = useState(query);

  const saveQuery = () => {
    onChange(state, `${state.selectedQueryCategory} (${state.page}) (${state.size})`);
  };

  const handleChange = (key: string, value: string | boolean | undefined) => {
    setState({
      ...state,
      [key]: value,
    });
  };

  const options: { [key: string]: { title: string; description: string; content: object } } = {
    Devices: {
      title: 'Devices',
      description: 'Grab All Devices Data from SevOne',
      content: (
        <>
          <VerticalGroup justify="space-between">
            <InlineFieldRow>
              <InlineField label="Size" labelWidth={15}>
                <Input
                  width={40}
                  name="Size"
                  onChange={(v: any) => handleChange('size', v.target.value)}
                  onBlur={saveQuery}
                  value={state.size}
                />
              </InlineField>
            </InlineFieldRow>
            <InlineFieldRow>
              <InlineField label="Page" labelWidth={15}>
                <Input
                  width={40}
                  name="Page"
                  onChange={(v: any) => handleChange('page', v.target.value)}
                  onBlur={saveQuery}
                  value={state.page}
                />
              </InlineField>
            </InlineFieldRow>
          </VerticalGroup>
        </>
      ),
    },
    Objects: {
      title: 'Objects',
      description: 'Grab All Objects Data from SevOne',
      content: (
        <>
          <VerticalGroup justify="space-between">
            <InlineFieldRow>
              <InlineField label="Device" labelWidth={15}>
                <Input
                  width={40}
                  name="Device"
                  value={state.deviceID}
                  onChange={(v: any) => handleChange('deviceID', v.target.value)}
                  onBlur={saveQuery}
                />
              </InlineField>
            </InlineFieldRow>
            <InlineFieldRow>
              <InlineField label="Size" labelWidth={15}>
                <Input
                  width={40}
                  name="Size"
                  onChange={(v: any) => handleChange('size', v.target.value)}
                  onBlur={saveQuery}
                  value={state.size}
                />
              </InlineField>
            </InlineFieldRow>
            <InlineFieldRow>
              <InlineField label="Page" labelWidth={15}>
                <Input
                  width={40}
                  name="Page"
                  onChange={(v: any) => handleChange('page', v.target.value)}
                  onBlur={saveQuery}
                  value={state.page}
                />
              </InlineField>
            </InlineFieldRow>
          </VerticalGroup>
        </>
      ),
    },
    Indicators: {
      title: 'Indicators',
      description: 'Grab All Indicators Data from SevOne',
      content: (
        <>
          <VerticalGroup justify="space-between">
            <InlineFieldRow>
              <InlineField label="Device" labelWidth={15}>
                <Input
                  width={40}
                  name="Device"
                  value={state.deviceID}
                  onChange={(v: any) => handleChange('deviceID', v.target.value)}
                  onBlur={saveQuery}
                />
              </InlineField>
            </InlineFieldRow>
            <InlineFieldRow>
              <InlineField label="Object" labelWidth={15}>
                <Input
                  width={40}
                  name="Object"
                  value={state.objectID}
                  onChange={(v: any) => handleChange('objectID', v.target.value)}
                  onBlur={saveQuery}
                />
              </InlineField>
            </InlineFieldRow>
            <InlineFieldRow>
              <InlineField label="Size" labelWidth={15}>
                <Input
                  width={40}
                  name="Size"
                  onChange={(v: any) => handleChange('size', v.target.value)}
                  onBlur={saveQuery}
                  value={state.size}
                />
              </InlineField>
            </InlineFieldRow>
            <InlineFieldRow>
              <InlineField label="Page" labelWidth={15}>
                <Input
                  width={40}
                  name="Page"
                  onChange={(v: any) => handleChange('page', v.target.value)}
                  onBlur={saveQuery}
                  value={state.page}
                />
              </InlineField>
            </InlineFieldRow>
          </VerticalGroup>
        </>
      ),
    },
  };

  const getQueryCategories = () => {
    let categoryOptions: Array<{ label: string; value: string; description: string }> = [];
    for (let key in options) {
      let value = options[key];
      categoryOptions.push({ label: value.title, value: key, description: value.description });
    }

    return categoryOptions;
  };
 
  return (
    <>
      <VerticalGroup justify="space-between">
        <InlineFieldRow>
          <InlineField label="Query Category" labelWidth={15}>
            <Select
              width={40}
              options={getQueryCategories()}
              value={query.selectedQueryCategory}
              menuPlacement="bottom"
              maxMenuHeight={220}
              onBlur={saveQuery}
              onChange={(v) => {
                handleChange('selectedQueryCategory', v.value)
              }}
            />
          </InlineField>
        </InlineFieldRow>
        {state.selectedQueryCategory != null && options[state.selectedQueryCategory ?? ''].content}
      </VerticalGroup>
    </>
  );
};
