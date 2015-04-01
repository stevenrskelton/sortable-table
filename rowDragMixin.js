/*jslint browser: true, plusplus: true, unparam: true, vars: true */
"use strict";
/**
 *    Row Drag-and-Drop
 */
var rowDragMixin = {
    dragRow: null,
    handleTRDragStart: function (e) {
        if (this.userSort) {
            this.dragRow = {
                tr: e.target,
                row: e.target.templateInstance.model.record.row,
                entered: null,
                index: this.data.indexOf(e.target.templateInstance.model.record.row)
            };
            e.target.classList.add('row-in-move');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('application/sortable-table-row-index', this.data.indexOf(e.target.templateInstance.model.record.row));
        }
    },
    handleTRDragOver: function (e) {
        if (e.preventDefault) { e.preventDefault(); } // Necessary. Allows us to drop.
        e.dataTransfer.dropEffect = 'move';
        this.handleTRDragEnter(e);
        return false;
    },
    findTRDropSide: function (e, self) {
        var tr = e.target;
        while (tr.tagName !== 'TR' && tr.parentElement) {
            tr = tr.parentElement;
            if (tr.tagName === 'TR') { self.dragRow.entered = tr; }
        }
        var index = self.data.indexOf(tr.templateInstance.model.record.row);
        if ((index < self.dragRow.index - 1) || (index > self.dragRow.index + 1)) {
            if (tr.getBoundingClientRect) {
                var center = tr.clientHeight / 2 + tr.getBoundingClientRect().top;
                return (center >= e.clientY) ? -1 : 1;
            }
            return 0;
        }
        if (index === self.dragRow.index - 1) {
            return -1;
        }
        if (index === self.dragRow.index + 1) {
            return 1;
        }
    },
    handleTRDragEnter: function (e) {
        if (this.dragRow) {
            var tr = e.target;
            this.dragRow.entered = null;
            while (tr.tagName !== 'TR' && tr.parentElement) {
                tr = tr.parentElement;
                if (tr.tagName === 'TR') { this.dragRow.entered = tr; }
            }
            var dragSide = this.findTRDropSide(e, this);
            if (dragSide < 0) {
                tr.classList.remove('row-move-below');
                tr.classList.add('row-move-above');
            } else if (dragSide > 0) {
                tr.classList.remove('row-move-above');
                tr.classList.add('row-move-below');
            }
            [].forEach.call(this.shadowRoot.querySelectorAll('tr'), function (element) {
                if (element !== tr) {
                    element.classList.remove('row-move-above');
                    element.classList.remove('row-move-below');
                }
            });
        }
    },
    handleTRDragLeave: function (e) {
        if (this.dragRow) {
            var tr = e.target;
            while (tr.tagName !== 'TR' && tr.parentElement) {
                tr = tr.parentElement;
                if (tr.tagName === 'TR') { this.dragRow.entered = tr; }
            }
            if (this.dragRow.entered === tr) {
                this.dragRow.entered = null;
            } else if (tr.classList) {
                if (tr.classList.contains('row-move-above')) { tr.classList.remove('row-move-above'); }
                if (tr.classList.contains('row-move-below')) { tr.classList.remove('row-move-below'); }
            }
        }
    },
    handleTRDrop: function (e) {
        if (e.stopPropagation) { e.stopPropagation(); } // stops the browser from redirecting.
        if (this.dragRow && this.dragRow.tr.parentNode === e.target.parentNode.parentNode) {
            var newIndex = this.data.indexOf(e.target.templateInstance.model.row);
            var oldIndex = +e.dataTransfer.getData('application/sortable-table-row-index');
            var dragSide = this.findTRDropSide(e, this);
            if (newIndex < oldIndex && dragSide === 1) {
                newIndex++;
            } else if (newIndex > oldIndex && dragSide === -1) {
                newIndex--;
            }
            if (newIndex !== oldIndex) {
                var b = this.data.splice(oldIndex, 1);
                this.data.splice(newIndex, 0, b[0]);
                this.forceRefresh++;
            }
        }
        return false;
    },
    handleTRDragEnd: function () {
        if (this.dragRow) {
            this.dragRow.tr.classList.remove('row-in-move');
            [].forEach.call(this.shadowRoot.querySelectorAll('tr'), function (element) {
                element.classList.remove('row-move-above');
                element.classList.remove('row-move-below');
            });
        }
        this.dragRow = null;
    }
};