&lt;sortable-table&gt;
================

Polymer Web Component that generates a sortable &lt;table> from JSON

> Maintained by [Steven Skelton](https://github.com/stevenrskelton).

## Demo

> [Check it live](http://stevenrskelton.ca/).

## Usage

1. Import Web Components' polyfill:

    ```html
    <script src="//cdnjs.cloudflare.com/ajax/libs/polymer/0.1.4/platform.js"></script>
    <script src="//cdnjs.cloudflare.com/ajax/libs/polymer/0.1.4/polymer.js"></script>
    ```

2. Import Custom Element:

    ```html
    <link rel="import" href="src/sortable-table.html">
    ```

3. Start using it!

    ```html
    <sortable-table></sortable-table>
    ```
	
## Options

Attribute  			| Options                   | Default             	| Description
---        			| ---                       | ---                 	| ---
`data`      		| *array*                  	| `[]`               	| Data rows
`columns`      		| *array*       			| `[]`               	| Columns to display, with options
`sortColumn`   		| *string*                  | `null`               	| Current sorted column
`sortDescending`   	| *boolean*                 | `false`              	| Current sorted column sort direction

### Data

Input format for `data` rows is an array of objects, where data for each column is a property of the row object.

### Columns

Attribute  			| Options                   | Default             	| Description
---        			| ---                       | ---                 	| ---
`name`      		| *string*                 	| _required_           	| Name of row property
`title`      		| *string*       			| `name`               	| Text to display in column header
`formula`   		| *function*                | `null`               	| Single parameter `row`, return will override any value for property in `data`
`cellTemplate`   	| *string*                 	| `null`              	| Renderer for entire `&lt;td&gt;` cell. Access to cell `{{value}}` and original `{{row}}` object from `data`
`footerTemplate`   	| *string*                 	| `null`              	| Renderer for entire `&lt;td&gt;` cell. Access to array of all `{{values}}` in column.


Example of a `footerTemplate` that computes the sum of a column:

```html
<template id="sumTemplate">
  <td class="ssDatatableHeader" style="text-align:right">
	{{values | sum}}
  </td>
</template>
```
__Note:__  Any filter used (eg: `sum` in above example) must be a member of `PolymerExpressions.prototype`

__Note:__  `cellTemplate` and `footerTemplate` are limited to a subset of Javascript within `{{ }}` expressions.  See the [Polymer documentation](http://www.polymer-project.org/docs/polymer/expressions.html).

## Todo

- Performance issues on column change
- Cleanup CSS
- Allow custom styling
- Row / cell selection
- Allow null columns to be auto-discovered
- Test for correct sort on mixed alpha+numeric data
- Test cell templates are accessible from all contexts.

[MIT License](http://opensource.org/licenses/MIT)