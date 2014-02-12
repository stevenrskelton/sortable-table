<sortable-table>
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
	
## Todo

- Performance issues on column change
- Cleanup CSS
- Row / Cell selection
- Allow null columns to be auto-discovered
- Test for correct sort on mixed alpha+numeric data