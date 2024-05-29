# Changelog

Breaking changes are distinguished by this symbol: 🔧

## 1.1.0 (2024-05-31)

- Added TLS Skip Verify checkbox to datasource configuration page
- Optimizations to the logic for finding an ID based on name
- 🔧 Re-write of Query Editor to optimize the code and add support for multi-select. Panels may need to be re-configured
- Added new Query Type for device groups
- Added option to query all devices in a device group
- If a device group is selected without a particular device selected as well, all devices in the group will be used
- 🔧 Previous Variable Editor interface has been replaced with the Query Editor interface
- Added new field in Variable Editor interface for filtering the variable results based on Regex. This differs from the Regex field provided by Grafana because Grafana's Regex field only filters the variable values while our field will filter the variable labels
- Added variables as options in select inputs of Query and Variable Editors
- Variables for object and indicator will return names instead of the id's making them easier to work with

## 1.0.0

- Initial release
