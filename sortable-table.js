/*jslint browser: true, plusplus: true, unparam: true, vars: true, newcap: true */
/*global Polymer, PolymerExpressions, JSON5, PathObserver, MutationObserver, ObjectObserver,
         columnDragMixin, rowDragMixin, rowFiltersMixin, rowEditorMixin */
"use strict";
Polymer(Polymer.mixin({
    disableColumnMove: false,
    footerTemplate: null,
    headerTemplate: null,
    lastPage: 1,
    multiSelect: false,
    page: 1,
    pageSize: Number.MAX_VALUE,
    dataSize: 0,
    rowEditorTemplate: null,
    multiRowEdit: false,
    rowSelection: false,
    rowTemplate: null,
    selected: null,
    sortColumn: null,
    sortDescending: false,
    showFooter: false,
    grid: false,
    toggleGrid: function () { this.grid = !this.grid; },
    dataSource: null,
    userSort: false,
    loading: false,
    publish: {
        args: {},
        data: [],
        columns: [],
        undoStack: []
    },
    ready: function () {
        var self = this;
        var dataSource = this.querySelector('[role="datasource"]');
        if (dataSource) {
            if (!this.dataSource) {
                this.dataSource = dataSource;
                this.rebuildColumns();
                this.dataSource.length = this.pageSize;
                this.dataSource.sortColumn = this.sortColumn;
                this.dataSource.sortDescending = this.sortDescending;
                if (!!this.dataSource.filterOps) { this.filterOps = this.dataSource.filterOps; }
                (new PathObserver(this.dataSource, 'loading')).open(function (newValue) {
                    self.loading = newValue;
                });
                (new PathObserver(this.dataSource, 'data')).open(function (newValue) {
                    self.data = newValue;
                });
                (new PathObserver(this.dataSource, 'dataSize')).open(function (newValue) {
                    self.dataSize = newValue;
                });
            }
        } else {
            [].forEach.call(this.childNodes, function (element) {
                if (element.nodeName === "#text") {
                    var text = element.textContent.trim();
                    if (text.length > 0) {
                        var data;
                        try {
                            data = JSON.parse(text);
                        } catch (e) {
                            try {
                                data = JSON5.parse(text);
                            } catch (e2) {
                                console.log('ERROR: Could not parse data.\n\nArrays, JSON and JSON5 are supported.');
                            }
                        }
                        if (data) {
                            self.data = data;
                            self.dataSize = data.length;
                            self.rebuildColumns();
                        } else {
                            self.data = [];
                        }
                    }
                }
            });
        }
        this.onMutation(this, this.ready);
    },
    /**
      *    Logic
      */
    observing: function (o) { return o; },
    isArray: function (a) {
        return Object.prototype.toString.call(a) === '[object Array]';
    },
    stopPropagation: function (e) { e.stopPropagation(); },
    customFormat: function (v, format) {
        if (format) {
            return format(v);
        }
        return v;
    },
    toggleRowFromSelected: function (row) {
        if (this.isArray(this.selected)) {
            var index = this.selected.indexOf(row);
            if (index > -1) {
                this.selected.splice(index, 1);
            } else {
                this.selected.push(row);
            }
        } else {
            if (this.selected === row) {
                this.selected = null;
            } else {
                this.selected = row;
            }
        }
    },
    columnWatches: [],
    addTemplateIfNotInDocument: function (templateId) {
        /* copy template from content into shadow dom */
        if (templateId && this.shadowRoot && !this.shadowRoot.getElementById(templateId)) {
            var t = this.querySelector('#' + templateId);
            if (!t) {
                var f = [].filter.call(this.children, function (o) { return o.id === templateId; });
                if (f.length > 0) { t = f[0]; }
            }
            if (t) {
                this.shadowRoot.appendChild(t);
            } else {
                console.log('ERROR: Could not find template `' + templateId + '`');
            }
        }
    },
    rebuildColumns: function () {
        if (this.columns.length === 0) {
            //try and load from DOM
            var columnNodes = this.querySelectorAll('sortable-column');
            var c = [];
            var self = this;
            if (this.columnObserver) { this.columnObserver.disconnect(); }
            this.columnObserver = new MutationObserver(function (mutations) {
                mutations.forEach(function (m) {
                    var sortableColumn = null;
                    if (m.type === 'attributes' && m.target.nodeName === 'SORTABLE-COLUMN') {
                        sortableColumn = self.readSortableColumn(m.target, null);
                    } else if (m.type === "characterData") {
                        sortableColumn = self.readSortableColumn(m.target.parentNode, null);
                    }
                    if (sortableColumn) {
                        var i = self.columns.findIndex(function (e, index) {
                            return e.name === sortableColumn.name;
                        });
                        self.columns.splice(i, 1, sortableColumn);
                    }
                });
            });
            if (columnNodes.length > 0) {
                [].forEach.call(columnNodes, function (n, index) {
                    c.push(self.readSortableColumn(n, index));
                    self.columnObserver.observe(n, {
                        attributes: true,
                        subtree: true,
                        characterData: true
                    });
                });
                this.columns = c;
                this.columnsChanged();
            } else if (this.data !== null && this.data.length > 0) {
                var unique = [];
                var i;
                var f = function (property) {
                    if (unique.indexOf(property) === -1) {
                        unique.push(property);
                        c.push({name: property, index: unique.length - 1 });
                    }
                };
                for (i = 0; i < this.data.length; i++) {
                    Object.keys(this.data[i]).forEach(f);
                }
                this.columns = c;
            }
        }
    },
    readSortableColumn: function (n, index) {
        var name = n.getAttribute('name');
        if (!name || name === '') { name = index; }
        if (String(name).indexOf(' ') > -1) { console.log('ERROR: Column name `' + name + '` contains an illegal character (` `)'); }
        var title = n.getAttribute('title');
        if (title === null) {
            title = n.textContent.trim();
            if (title === '') { title = name; }
        }
        var sortable = n.getAttribute('sortable');
        var formula = n.getAttribute('formula');
        if (formula) {
            /*jslint regexp: true*/
            var match = formula.match(/function[^\(]*\(([^\)]*)\)[^\{]*\{([^\}]*)\}/);
            /*jslint regexp: false*/
            if (match) {
                var args = match[1].split(',').map(function (arg) { return arg.replace(/\s+/, ''); });
                /*jslint evil: true*/
                formula = new Function(args, match[2]);
                /*jslint evil: false*/
            } else if (this[formula]) {
                //not an inlined function, assume it's a member of this
                formula = this[formula];
            } else if (PolymerExpressions.prototype[formula]) {
                //not an inlined function, or member of this, check PolymerExpressions.prototype
                formula = PolymerExpressions.prototype[formula];
            } else if (formula.substring(0, 29) === 'PolymerExpressions.prototype.') {
                var f = formula.substring(29);
                formula = PolymerExpressions.prototype[f];
                if (!formula) {
                    console.log('ERROR: Could not load formula `' + formula + '` from PolymerExpressions.prototype for column `' + name + '`');
                }
            } else {
                console.log('ERROR: Could not load formula `' + formula + '` for column `' + name + '`');
            }
        }
        return {
            name: name,
            index: index,
            title: title,
            formula: formula,
            sortable: sortable,
            datatype: n.getAttribute('datatype'),
            cellTemplate: n.getAttribute('cellTemplate'),
            headerTemplate: n.getAttribute('headerTemplate'),
            footerTemplate: n.getAttribute('footerTemplate'),
            headerClass: n.getAttribute('headerClass') || '',
            class: n.getAttribute('class') || '',
            footerClass: n.getAttribute('footerClass') || ''
        };
    },
    /**
      *    Change Observers
      */
    argsChanged: function (oldValue, newValue) {
        var observer = new ObjectObserver(newValue);
        var self = this;
        observer.open(function (added, removed, changed, getOldValueFn) {
            self.forceFooterRefresh++;
            self.forceRefresh++;
        });
    },
    columnsChanged: function () {
        var self = this;
        //explode columns if simple text array
        if (self.columns.length > 0 && typeof self.columns[0] === 'string') {
            self.columns = self.columns.map(function (column, index, array) {
                return { name: column, index: index, title: column };
            });
        }
        //watch templateIds since if added/modified we need to copy those templates into the shadow dom
        function addTemplateWatches(column, field) {
            var i;
            for (i = 0; i < self.columnWatches.length; i++) {
                /*jslint nomen: true*/
                if (self.columnWatches[i].object_ === column && self.columnWatches[i].path_[0] === field) { return; }
                /*jslint evil: false*/
            }
            var observer = new PathObserver(column, field);
            self.columnWatches.push(observer);
            observer.open(function (added, removed, changed, getOldValueFn) {
                self.columnsChanged();
            });
        }
        var i, c;
        for (i = 0; i < this.columns.length; i++) {
            c = this.columns[i];
            this.addTemplateIfNotInDocument(c.cellTemplate);
            this.addTemplateIfNotInDocument(c.headerTemplate);
            this.addTemplateIfNotInDocument(c.footerTemplate);
            if (c.footerTemplate) { this.showFooter = true; }
            addTemplateWatches(c, 'cellTemplate');
            addTemplateWatches(c, 'headerTemplate');
            addTemplateWatches(c, 'footerTemplate');
        }
        if (this.dataSource) { this.dataSource.columns = this.columns; }
        this.forceRefresh++;
    },
    rowSelectionChanged: function (a, val) {
        var table = this.shadowRoot.querySelector('tbody');
        if (table) {
            if (val) {
                table.classList.add('row-selection');
            } else {
                table.classList.remove('row-selection');
            }
        }
    },
    multiSelectChanged: function (a, val) {
        if (val) {
            if (!this.isArray(this.selected)) {
                if (this.selected) {
                    this.selected = [this.selected];
                } else {
                    this.selected = [];
                }
            }
        } else if (this.isArray(this.selected)) {
            if (this.selected.length > 0) {
                this.selected = this.selected[0];
            } else {
                this.selected = null;
            }
        }
    },
    selectedChanged: function (a, val) {
        if (val) {
            if (this.isArray(val)) {
                if (!this.multiSelect) { this.multiSelect = true; }
            } else {
                if (this.multiSelect) { this.multiSelect = false; }
            }
        }
    },
    sortColumnChanged: function () { if (this.dataSource) { this.dataSource.sortColumn = this.sortColumn; } },
    sortDescendingChanged: function () { if (this.dataSource) { this.dataSource.sortDescending = this.sortDescending; } },
    dataChanged: function (o, n) {
        if (n === null) { this.data = []; }
        this.rebuildColumns();
        this.pageSizeChanged();
    },
    cellTemplateChanged: function (a, t) { this.addTemplateIfNotInDocument(t); },
    rowTemplateChanged: function (a, t) { this.addTemplateIfNotInDocument(t); },
    headerTemplateChanged: function (a, t) { this.addTemplateIfNotInDocument(t); this.forceRefresh++; },
    footerTemplateChanged: function (a, t) { this.addTemplateIfNotInDocument(t); this.forceRefresh++; },
    rowEditorTemplateChanged: function (a, t) { this.addTemplateIfNotInDocument(t); },
    pageSizeChanged: function () {
        if (this.dataSource) {
            this.dataSource.length = this.pageSize;
        } else if (this.data) {
            this.dataSize = this.data.length;
        }
        this.lastPage = Math.max(1, Math.ceil(this.dataSize / this.pageSize));
    },
    pageChanged: function () { if (this.dataSource) { this.dataSource.start = (this.page - 1) * this.pageSize; } },
    /**
      *    Checkbox helper functions
      */
    checkbox: false,
    checkedbox: function (e) {
        var row = e.target.templateInstance.model.record.row;
        this.toggleRowFromSelected(row);
        e.preventDefault();
    },
    checkall: function (e) {
        if (e.target.checked) {
            var i;
            for (i = 0; i < this.data.length; i++) {
                if (this.selected.indexOf(this.data[i]) === -1) { this.selected.push(this.data[i]); }
            }
        } else {
            this.selected = [];
        }
    },
    /**
      *    Template Functions
      */
    changeSort: function (e, p) {
        if (!this.userSort && e.target.templateInstance.model.column &&
                e.target.templateInstance.model.column.sortable !== false &&
                e.target.templateInstance.model.column.sortable !== 'false') {
            var clickedSortColumn = e.target.templateInstance.model.column.name;
            if (clickedSortColumn === this.sortColumn) {
                //column already sorted, reverse sort
                this.sortDescending = !this.sortDescending;
            } else {
                this.sortColumn = clickedSortColumn;
            }
        }
    },
    rowSelect: function (e, p) {
        if (this.rowSelection && e.target.templateInstance && e.target.nodeName !== 'INPUT') {
            var model = e.target.templateInstance.model;
            var row = model.row;
            if (model.record) { row = model.record.row; }
            this.toggleRowFromSelected(row);
        }
    },
    updateColumnWidths: function (e, p) {
        var columns = this.shadowRoot.querySelectorAll('thead > tr > th');
        [].forEach.call(columns, function (column) {
            if (column.templateInstance.model.column) { column.templateInstance.model.column.width = column.clientWidth; }
        });
    },
    /**
      *    Expression Filters
      */
    sortByKey: function (array, key, desc, columns, selected, pageSize, page, args, l) {
        //ignore l, it is used to trigger observe.js watch only

        var sortedArray;

        var sortFunction = function (a, b) {
            var x, y;
            //determine if computed field
            var formula = null;
            var i;
            for (i = 0; i < columns.length; i++) {
                if (columns[i].name === key) {
                    formula = columns[i].formula;
                    break;
                }
            }
            if (formula) {
                if (a[key] === undefined) {
                    x = formula(a, args);
                    y = formula(b, args);
                } else {
                    x = formula(a[key], a, args);
                    y = formula(b[key], b, args);
                }
            } else {
                x = a[key];
                y = b[key];
            }
            if (x === undefined || y === undefined) {
                //sort undefined after
                if (x === undefined) {
                    return !desc;
                }
                return desc;
            }
            if (typeof x === "string" && typeof y === "string") {
                if (isNaN(x) || isNaN(y)) {
                    x = x.toLowerCase();
                    y = y.toLowerCase();
                } else {
                    x = +x;
                    y = +y;
                }
            }
            if (desc) {
                return ((x < y) ? 1 : ((x > y) ? -1 : 0));
            }
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        };

        if (!this.dataSource) {
            var checkColumnFilters = this.checkColumnFilters;
            var filteredArray = array.filter(function (row) {
                return columns.every(function (column, columnIndex) { return checkColumnFilters(column, row); });
            });
            array = filteredArray;
        }

        if (key !== null && !this.dataSource && !this.userSort) {
            if (array.every(function (element, index) {
                    return (index + 1 >= array.length) || sortFunction(element, array[index + 1]) <= 0;
                })) {
                sortedArray = array;
            } else {
                sortedArray = array.sort(sortFunction);
            }
        } else {
            sortedArray = array;
        }

        var records = [];
        var isMultiSelect = this.isArray(selected);

        if (page < 1) { page = 1; }

        var start, end;

        if (this.dataSource) {
            start = 0;
            end = array.length;
        } else {
            start = (pageSize < Number.MAX_VALUE) ? Math.min(pageSize * (page - 1), sortedArray.length) : 0;
            end = (pageSize < Number.MAX_VALUE) ? Math.min(start + (+pageSize), sortedArray.length) : sortedArray.length;
        }

        var valueSelector = function (row, column) { return row[column.name]; };
        if (sortedArray.length > 0 && this.isArray(sortedArray[0])) {
            valueSelector = function (row, column) { return row[column.index]; };
        }

        var i, row, isSelected, isEditMode, isDirty, isInUndo, fields;
        var f = function (i) {
            row = sortedArray[i];
            isSelected = isMultiSelect ? selected.indexOf(row) > -1 : row === selected;
            isEditMode = this.editRow === row;
            isDirty = false;
            isInUndo = this.undoStack.filter(function (element) { return element.ref === row; });
            if (isInUndo.length > 0) { isDirty = this.rowHasBeenEdited(isInUndo[0]); }
            fields = {};
            columns.forEach(function (column, index, array) {
                var value;
                if (column.formula) {
                    if (row[column.name] !== undefined || row[column.index] !== undefined) {
                        value = column.formula(valueSelector(row, column), row, args);
                    } else {
                        value = column.formula(row, args);
                    }
                } else {
                    value = valueSelector(row, column);
                }
                fields[column.name] = { value: value, row: row, column: column, sortColumn: key, args: args };
            });
            records.push({ selected: isSelected, editMode: isEditMode, dirty: isDirty, fields: fields, row: row });
        };
        var self = this;
        for (i = start; i < end; i++) { f.call(self, i); }
        return records;
    },
    selectProperty: function (objects, column, args) {
        var arr = [];
        var rowArr = [];
        var i, row, value;
        for (i = 0; i < objects.length; i++) {
            row = objects[i];
            if (column.formula) {
                if (row[column.name] === undefined) {
                    value = column.formula(row, args);
                } else {
                    value = column.formula(row[column.name], row, args);
                }
            } else {
                value = row[column.name];
            }
            rowArr.push(row[column.name]);
            arr.push(value);
        }
        return { values: arr, rowValues: rowArr, column: column, args: args };
    },
    naturalNumbers: function (n, mid) {
        var visible = 5;
        var start, end;
        if (mid !== null) {
            var range = Math.min(visible, n);
            if (mid < range) {
                start = 1;
                end = Math.min(mid + range, range);
            } else if (mid > n - range + 1) {
                start = Math.max(n - range + 1, 1);
                end = n;
            } else {
                start = Math.max(1, mid - Math.floor(range / 2));
                end = Math.min(n, mid + Math.floor((range - 1) / 2));
            }
        } else {
            start = 1;
            end = n;
        }
        var arr = [];
        var i;
        for (i = start; i <= end; i++) { arr.push(i); }
        return arr;
    },
    forceRefresh: 0,
    forceFooterRefresh: 1,
    refreshFooter: function () {
        this.updateEditChanged();
        this.forceFooterRefresh++;
    }
}, columnDragMixin, rowDragMixin, rowFiltersMixin, rowEditorMixin));