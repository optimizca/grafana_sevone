import React, { useEffect } from 'react';
import { InlineField, Select, InlineFieldRow, Input, VerticalGroup } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from '../datasource';
import { MyDataSourceOptions, MyQuery } from '../types';

import _ from 'lodash';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export function QueryEditor({ query, onChange, datasource }: Props) {

  const updateQuery = (key: string, value: any) => {
    onChange({ ...query, [key]: value });
  };

  let [deviceQueryOptions, setDeviceQueryOptions] = React.useState([{}]);
  let [someDeviceQueryOptions, setSomeDeviceQueryOptions] = React.useState([{}]);
  let [allDeviceQueryOptions, setAllDeviceQueryOptions] = React.useState([{}]);
  let [objectQueryOptions, setObjectQueryOptions] = React.useState([{}]);
  let [indicatorQueryOptions, setIndicatorsQueryOptions] = React.useState([{}]);

  useEffect(() => {
    const getDevices = async () => {
      let token = '';
      token = await datasource.getToken();
      let parseJson = [{}];
      let parseAllJson = [{}];
      let results = await datasource.sevOneConnection.getDevices(token,0,20,0);
      let allResults = await datasource.sevOneConnection.getAllDevices(token,0);
      parseJson[0] = { label: results.content[0].name, value: results.content[0].id };
      parseAllJson[0] = { label: allResults.content[0].name, value: allResults.content[0].id };
      for (let i = 1; i < results.content.length; i++) {
        parseJson.push({ label: results.content[i].name, value: results.content[i].id });
      }
      for (let i = 1; i < allResults.content.length; i++) {
        parseAllJson.push({ label: allResults.content[i].name, value: allResults.content[i].id });
      }
      setDeviceQueryOptions(parseJson);
      setAllDeviceQueryOptions(parseAllJson);
      setSomeDeviceQueryOptions(parseJson);
    };
    getDevices();
  }, [datasource.sevOneConnection, datasource]);

  const getObjects = async (deviceId: number | undefined) => {
    let token = '';
    token = await datasource.getToken();
    let parseJson = [{}];
    let results = await datasource.sevOneConnection.getObjects(token,0,deviceId?.toString(),20,0);
    parseJson[0] = { label: results.content[0].name, value: results.content[0].id };
    for (let i = 1; i < results.content.length; i++) {
      parseJson.push({ label: results.content[i].name, value: results.content[i].id });
    }
    setObjectQueryOptions(parseJson);
  };

  const getIndicators = async (deviceId: number | undefined, objectId: number | undefined) => {
    let token = '';
    token = await datasource.getToken();
    let parseJson = [{}];
    let results = await datasource.sevOneConnection.getIndicators(token,0,deviceId?.toString(),objectId?.toString(),20,0);
    parseJson[0] = { label: results.content[0].name, value: results.content[0].id };
    for (let i = 1; i < results.content.length; i++) {
      parseJson.push({ label: results.content[i].name, value: results.content[i].id });
    }
    setIndicatorsQueryOptions(parseJson);
  };

  const parseData = (value: string | undefined) =>{
    let count = 0;
    const results = allDeviceQueryOptions.filter((device: any) => {
      if(count < 20){
        if(device.label.toLowerCase().includes(value?.toLowerCase())){
          count ++;
          return true;
        }else{
          return false;
        }
      }else{
        return false;
      }
    })
    setDeviceQueryOptions(results)
  }

  const options: { [key: string]: { title: string; description: string; content: object } } = {
    Devices: {
      title: 'Devices',
      description: 'Grab All Devices Data from SevOne',
      content: (
        <>
          <VerticalGroup justify="space-between">
            <InlineFieldRow>
              <InlineField label="Devices">
                <Select
                  width={40}
                  options={deviceQueryOptions}
                  value={query.deviceID}
                  defaultValue={query.deviceID}
                  isSearchable={true}
                  isClearable={true}
                  isMulti={false}
                  backspaceRemovesValue={false}
                  allowCustomValue={true}
                  menuPlacement="auto"
                  onChange={(v) => {
                    updateQuery('deviceID', v);
                  }}
                  onInputChange={(v) => {
                    if(v){
                      parseData(v);
                    } else{
                      setDeviceQueryOptions(someDeviceQueryOptions);
                    }
                  }}
                />
              </InlineField>
            </InlineFieldRow>
            <InlineFieldRow>
              <InlineField label="Size">
                <Input
                  width={20}
                  name="Size"
                  onBlur={(e) => updateQuery('size', e.target.value)}
                  value={query.size}
                />
              </InlineField>
            </InlineFieldRow>
            <InlineFieldRow>
              <InlineField label="Page">
                <Input
                  width={20}
                  name="Page"
                  defaultValue={0}
                  onBlur={(e) => updateQuery('page', e.target.value)}
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
              <InlineField label="Devices">
                <Select
                  width={40}
                  options={deviceQueryOptions}
                  value={query.deviceID}
                  defaultValue={query.deviceID}
                  isSearchable={true}
                  isClearable={true}
                  isMulti={false}
                  backspaceRemovesValue={false}
                  allowCustomValue={true}
                  menuPlacement="auto"
                  onChange={(v) => {
                    updateQuery('deviceID', v);
                  }}
                  onInputChange={(v) => {
                    if(v){
                      parseData(v);
                    } else{
                      setDeviceQueryOptions(someDeviceQueryOptions);
                    }
                  }}
                />
              </InlineField>
            </InlineFieldRow>
            <InlineFieldRow>
              <InlineField label="Size">
                <Input
                  width={20}
                  name="Size"
                  defaultValue={query.size}
                  onBlur={(e) => updateQuery('size', e.target.value)}
                />
              </InlineField>
            </InlineFieldRow>
            <InlineFieldRow>
              <InlineField label="Page">
                <Input
                  width={20}
                  name="Page"
                  defaultValue={0}
                  onBlur={(e) => updateQuery('page', e.target.value)}
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
              <InlineField label="Devices">
                <Select
                  width={40}
                  options={deviceQueryOptions}
                  value={query.deviceID}
                  defaultValue={query.deviceID}
                  isSearchable={true}
                  isClearable={true}
                  isMulti={false}
                  backspaceRemovesValue={false}
                  allowCustomValue={true}
                  menuPlacement="auto"
                  onChange={(v) => {
                    updateQuery('deviceID', v);
                    if(v){
                      getObjects(v.value);
                    }
                  }}
                  onInputChange={(v) => {
                    if(v){
                      parseData(v);
                    } else{
                      setDeviceQueryOptions(someDeviceQueryOptions);
                    }
                  }}
                />
              </InlineField>
            </InlineFieldRow>
            <InlineFieldRow>
              <InlineField label="Object">
                <Select
                  width={40}
                  options={objectQueryOptions}
                  value={query.objectID}
                  defaultValue={query.objectID}
                  isSearchable={true}
                  isClearable={true}
                  isMulti={false}
                  backspaceRemovesValue={false}
                  allowCustomValue={true}
                  menuPlacement="auto"
                  onChange={(v) => {
                    updateQuery('objectID', v);
                  }}
                />
              </InlineField>
            </InlineFieldRow>
            <InlineFieldRow>
              <InlineField label="Size">
                <Input
                  width={20}
                  name="Size"
                  defaultValue={query.size}
                  onBlur={(e) => updateQuery('size', e.target.value)}
                />
              </InlineField>
            </InlineFieldRow>
            <InlineFieldRow>
              <InlineField label="Page">
                <Input
                  width={20}
                  name="Page"
                  defaultValue={0}
                  onBlur={(e) => updateQuery('page', e.target.value)}
                />
              </InlineField>
            </InlineFieldRow>
          </VerticalGroup>
        </>
      ),
    },
    IndicatorData: {
      title: 'Indicator Data',
      description: 'Grab the Indicator Data from SevOne',
      content: (
        <>
          <VerticalGroup justify="space-between">
            <InlineFieldRow>
              <InlineField label="Devices">
                <Select
                  width={40}
                  options={deviceQueryOptions}
                  value={query.deviceID}
                  defaultValue={query.deviceID}
                  isSearchable={true}
                  isClearable={true}
                  isMulti={false}
                  backspaceRemovesValue={false}
                  allowCustomValue={true}
                  menuPlacement="auto"
                  onChange={(v) => {
                    updateQuery('deviceID', v);
                    if(v){
                      getObjects(v.value);
                    }
                  }}
                />
              </InlineField>
            </InlineFieldRow>
            <InlineFieldRow>
              <InlineField label="Object">
                <Select
                  width={40}
                  options={objectQueryOptions}
                  value={query.objectID}
                  defaultValue={query.objectID}
                  isSearchable={true}
                  isClearable={true}
                  isMulti={false}
                  backspaceRemovesValue={false}
                  allowCustomValue={true}
                  menuPlacement="auto"
                  onChange={(v) => {
                    updateQuery('objectID', v);
                    if(v && query.deviceID){
                      getIndicators(query.deviceID.value,v.value);
                    }
                  }}
                />
              </InlineField>
            </InlineFieldRow>
            <InlineFieldRow>
              <InlineField label="Indicator">
                <Select
                  width={40}
                  options={indicatorQueryOptions}
                  value={query.indicatorID}
                  defaultValue={query.indicatorID}
                  isSearchable={true}
                  isClearable={true}
                  isMulti={false}
                  backspaceRemovesValue={false}
                  allowCustomValue={true}
                  menuPlacement="auto"
                  onChange={(v) => {
                    updateQuery('indicatorID', v);
                  }}
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
    <div className="gf-form">
    <VerticalGroup justify="space-between">
      <InlineFieldRow>
        <InlineField label="Query Category">
          <Select
            width={40}
            options={getQueryCategories()}
            value={query.selectedQueryCategory}
            menuPlacement="bottom"
            maxMenuHeight={220}
            onChange={(v) => {
              query.deviceID = null;
              query.objectID = null;
              query.indicatorID = null;
              setObjectQueryOptions([{}])
              updateQuery('selectedQueryCategory', v);
            }}
          />
        </InlineField>
      </InlineFieldRow>
      {query.selectedQueryCategory != null && options[query.selectedQueryCategory.value ?? ''].content}
    </VerticalGroup>
  </div>
  );
}
