# SevOne

This SevOne Grafana Datasource Plugin enables communication between Grafana and SevOne to pull Device data, Object data, Indicator data, and Indicator metrics your instance.

# Setup Instructions

## Step 1: Install Grafana Plugin

Download or clone the repository and move the unzipped folder into your Grafana plugins folder.

Add our plugin to the list of unsigned plugins in your Grafana configuration file then restart Grafana.
```
allow_loading_unsigned_plugins = optimiz-sevone-datasource
```

## Step 2: Grafana Datasource Configuration

1. Open Grafana Configuration => Data Sources
2. Click on the "Add data source" Button
3. Search for and add our "Optimiz-SevOne Plugin"
4. Configure the data source based on fields below. All fields listed below are Required

- URL: Enter the URL of the SevOne instance
- Username: Enter a username that can access the SevOne instance
- Password: Enter password of user

5. Click on the "Save & Test" Button. If you get the message "Data source connection is successful" then the plugin is ready to use!

# Query Categories

- [Devices](#devices)
- [Object](#object)
- [Indicators](#indicators)
- [Indicators Metrics](#indicators-metric)

## Devices
| Option Name | Description | Options | Additional Info |
| ----------- | ----------- | ------- | --------------- |
| Devices | Selecting a Device will only return the data of the specified Device. If no Device is selected then the query will return all Device data. | Device Name or ID | Not Required for this Query Category |
| Size | Limits the amount of records returned to the number submitted | 1-10000 | Default is 10 |
| Page | This option, in combination with the Size input, can be thought of as pagination for your requests. Ex. Setting a Size of 10 returns the first 10 records and to see the 10 records following those, increase your page number. | 0-9999 | Default is 0, which is the first page |

## Object
| Option Name | Description | Options | Additional Info |
| ----------- | ----------- | ------- | --------------- |
| Devices | Selecting a Device will return all the Objects connected to the specified Device | Device Name or ID | Required for this Query Category |
| Size | Limits the amount of records returned to the number submitted | 1-10000 | Default is 10 |
| Page | This option, in combination with the Size input, can be thought of as pagination for your requests. Ex. Setting a Size of 10 returns the first 10 records and to see the 10 records following those, increase your page number. | 0-9999 | Default is 0, which is the first page |

## Indicators
| Option Name | Description | Options | Additional Info |
| ----------- | ----------- | ------- | --------------- |
| Devices | Selecting a Device will fill in the Object field with Objects connected to the specificed Device | Device Name or ID | Required for this Query Category |
| Object | Selecting a Object will return all the Indicators data connected to the specified Device and the specified Object | Object Name or ID | Required for this Query Category |
| Size | Limits the amount of records returned to the number submitted | 1-10000 | Default is 10 |
| Page | This option, in combination with the Size input, can be thought of as pagination for your requests. Ex. Setting a Size of 10 returns the first 10 records and to see the 10 records following those, increase your page number. | 0-9999 | Default is 0, which is the first page |

## Indicators Metrics
| Option Name | Description | Options | Additional Info |
| ----------- | ----------- | ------- | --------------- |
| Devices | Selecting a Device will fill in the Object field with Objects connected to the specificed Device | Device Name or ID | Required for this Query Category |
| Object | Selecting a Object will fill in the Indicator field with Indicator connected to the specificed Device and the specificed Object| Object Name or ID | Required for this Query Category |
| Indicator | Selecting a Indicator will return the Indicators metrics connected to the specified Device, the specified Object, and the specified Indicator | Indicator Name or ID | Required for this Query Category |