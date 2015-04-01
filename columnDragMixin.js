/*jslint browser: true, plusplus: true, unparam: true, vars: true */
"use strict";
/**
 *    Column Drag-and-Drop
 */
var columnDragMixin = {
    dragColumn: null,
    handleTHDragStart: function (e) {
        if (!this.disableColumnMove && !(this.rowTemplate || this.rowEditorTemplate)) {
            this.dragColumn = {
                th: e.target,
                column: e.target.templateInstance.model.column,
                entered: null,
                index: this.columns.indexOf(e.target.templateInstance.model.column)
            };
            e.target.classList.add('column-in-move');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('application/sortable-table-column-name', this.dragColumn.index);
        }
    },
    handleTHDragOver: function (e) {
        if (e.preventDefault) { e.preventDefault(); }// Necessary. Allows us to drop.
        e.dataTransfer.dropEffect = 'move';
        this.handleTHDragEnter(e);
        return false;
    },
    findTHDropSide: function (e, self) {
        var th = e.target;
        var index = self.columns.indexOf(th.templateInstance.model.column);
        if ((index < self.dragColumn.index - 1) || (index > self.dragColumn.index + 1)) {
            if (th.getBoundingClientRect) {
                var center = th.clientWidth / 2 + th.getBoundingClientRect().left;
                return (center >= e.clientX) ? -1 : 1;
            }
            return 0;
        }
        if (index === self.dragColumn.index - 1) {
            return -1;
        }
        if (index === self.dragColumn.index + 1) {
            return 1;
        }
    },




    handleTHDragEnter: function (e) {
        if (this.dragColumn) {
            var th = e.target;
            this.dragColumn.entered = null;
            while (th.tagName !== 'TH' && th.parentElement) {
                th = th.parentElement;
                if (th.tagName === 'TH') { this.dragColumn.entered = th; }
            }
            var dragSide = this.findTHDropSide(e, this);
            if (dragSide < 0) {
                th.classList.remove('column-move-right');
                th.classList.add('column-move-left');
            } else if (dragSide > 0) {
                th.classList.remove('column-move-left');
                th.classList.add('column-move-right');
            }
            [].forEach.call(this.shadowRoot.querySelectorAll('th'), function (element) {
                if (element !== th) {
                    element.classList.remove('column-move-left');
                    element.classList.remove('column-move-right');
                }
            });
        }
    },
    handleTHDragLeave: function (e) {
        if (this.dragColumn) {
            var th = e.target;
            if (this.dragColumn.entered === th) {
                this.dragColumn.entered = null;
            } else if (th.classList) {
                if (th.classList.contains('column-move-left')) { th.classList.remove('column-move-left'); }
                if (th.classList.contains('column-move-right')) { th.classList.remove('column-move-right'); }
            }
        }
    },




    handleTHDrop: function (e) {
        if (e.stopPropagation) { e.stopPropagation(); } // stops the browser from redirecting.
        if (this.dragColumn && this.dragColumn.th.parentNode === e.target.parentNode) {
            var newIndex = this.columns.indexOf(e.target.templateInstance.model.column);
            var oldIndex = +e.dataTransfer.getData('application/sortable-table-column-name');
            var dragSide = this.findTHDropSide(e, this);
            if (newIndex < oldIndex && dragSide === 1) {
                newIndex++;
            } else if (newIndex > oldIndex && dragSide === -1) {
                newIndex--;
            }
            if (newIndex !== oldIndex) {
                var b = this.columns.splice(oldIndex, 1);
                this.columns.splice(newIndex, 0, b[0]);
            }
        }
        return false;
    },

    handleTHDragEnd: function () {
        if (this.dragColumn) {
            this.dragColumn.th.classList.remove('column-in-move');
            [].forEach.call(this.shadowRoot.querySelectorAll('th'), function (element) {
                element.classList.remove('column-move-left');
                element.classList.remove('column-move-right');
            });
        }
        this.dragColumn = null;
    }
};