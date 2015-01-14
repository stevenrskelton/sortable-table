/**
 *	Row Editor
 */
var rowEditorMixin = {
	editChanged: false,
	editRow: null,
	updateEditChanged: function(){
		if(this.undoStack.length > 1) this.editChanged = true;
		else if(this.undoStack.length === 1) this.editChanged = this.rowHasBeenEdited(this.undoStack[0]);
		else this.editChanged = false;
		return this.editChanged;
	},
	rowHasBeenEdited: function(undoElement){
		return Object.getOwnPropertyNames(undoElement.original).some(function(val, idx, array) {
			return undoElement.ref[val] !== undoElement.original[val] && undoElement.original[val] !== null;
		});
	},
	rowEdit: function(e,p){
		if(this.rowEditorTemplate && (this.multiRowEdit || this.undoStack.length === 0)){
			var model = e.target.templateInstance.model;
			var row = model.row;
			if(model.record) row = model.record.row;

			if(this.undoStack.length > 0 && !this.rowHasBeenEdited(this.undoStack[this.undoStack.length - 1])) this.undoStack.pop();

			if(this.undoStack.length === 0){
				this.editChanged = false;
				this.undoStack.push({
					ref: row,
					original: JSON.parse(JSON.stringify(row))
				});
			}else{
				this.editChanged = true;
				if(this.undoStack[this.undoStack.length - 1].ref !== row){
					this.undoStack.push({
						ref: row,
						original: JSON.parse(JSON.stringify(row))
					});
				}
			}
			this.editRow = row;
		}
	},
	closeEdit: function(e){
		this.editChanged = false;
		this.undoStack = [];
		this.editRow = null;
	},
	undoAllEdit: function(e){
		while(this.undoStack.length>0) this.undoEdit.call(this, e);
	},
	undoEdit: function(e){
		if(this.undoStack.length > 0){
			var self = this;
			var first = this.undoStack.pop();
			Object.getOwnPropertyNames(first.original).forEach(function(val, idx, array) {
				if(first.ref[val] !== first.original[val] && first.original[val] !== null)
					first.ref[val] = first.original[val];
			});
			if(this.undoStack.length > 0) this.editRow = this.undoStack[this.undoStack.length - 1].ref;
			else this.editRow = null;
			this.refreshFooter();
		}
	},
	cancelEdit: function(e){
		this.undoAllEdit.call(this, e); this.closeEdit.call(this, e);
	},
	/**
	 *	Row Editor template helper functions
	 */
	moveToPage: function(e){ this.page = Number(e.currentTarget.textContent); },
	moveToPreviousPage: function(){ if(this.page > 1) this.page--; },
	moveToNextPage: function(){ if(this.dataSize > this.page * this.pageSize) this.page++; },
	moveToFirstPage: function(){ this.page = 1; },
	moveToLastPage: function(){ this.page = this.lastPage; },
	showMore: function(){
		if(!this.originalPageSize) this.originalPageSize = this.pageSize;
		this.pageSize = Math.min(this.dataSize, this.pageSize + this.originalPageSize);
	}
}