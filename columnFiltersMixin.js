/**
 *	Column Filters
 */
var columnFiltersMixin = {
	filterTemplate: null,
	filterOps: [
		{ title:'Equals', op:'=' },
		{ title:'Less Than', op:'<' },
		{ title:'Greater Than', op:'>' },
		{ title:'Less Than Or Equal', op:'≤' },
		{ title:'Greater Than Or Equal', op:'≥' },
		{ title:'Starts With', op:'Starts With', type:'string' },
		{ title:'Contains', op:'Contains', type:'string' }
	],
	getFilterOps: function(column){
		return this.filterOps.map(function(element){
			if(typeof element === 'object') return {title:element.title||element.op,op:element.op,html:element.html||element.op};
			else return {title:element,op:element,html:element};
		});
	},
	forceFilterRefresh: 0,
	generateColumnFilters: function(){
		var filters = [];
		this.columns.forEach(function(column){
			if(column.filters) column.filters.forEach(function(filter){
				filters.push({ column: column.name, op: filter.op, value: filter.value });
			});
		});
		return filters;
	},
	createFilter: function(event,i,o){
		event.stopPropagation();
		var dropdown = o.querySelector('core-dropdown');
		if(dropdown.style.display == 'none') dropdown.toggle();
	},
	addFilterReturn: function(event,i,o){
		if(event.keyCode === 13) this.addFilter(event,i,o);
	},
	addFilter: function(event,i,o){
		var dropdown = o.parentElement;
		var input = dropdown.querySelector('input[type="text"]');
		if(input.value!==''){
			var op = o.getAttribute('data-op');
			var model = o.templateInstance.model;
			if(!model.column.filters) model.column.filters = [];
			model.column.filters.push({op: op, value: input.value});
			dropdown.toggle();
			input.value = '';
			if(this.dataSource) this.dataSource.filters = this.generateColumnFilters();
			this.forceFilterRefresh++;
		}else dropdown.toggle();
	},
	removeFilter: function(e,i,o){
		var model = o.templateInstance.model;
		var index = model.column.filters.indexOf(model.filter);
		model.column.filters.splice(index, 1);
		if(this.columns.every(function(column){
			return !column.filters || column.filters.length === 0;
		})) this.forceFilterRefresh = 0;
		if(this.dataSource) this.dataSource.filters = this.generateColumnFilters();
	},
	clearFilters: function(e,i,o){
		if(confirm('Clear all filters?')){
			this.columns.forEach(function(column){
				column.filters = null;
			});
			this.forceFilterRefresh = 0;
		}
	},
	checkColumnFilters: function(column,row){
		if(column.filters && column.filters.length){
			var value = row[column.name];
			return column.filters.every(function(filter){
				switch (filter.op){
					case "=":
						return value == filter.value;
					case ">":
						return value > filter.value;
					case "≥":
						return value >= filter.value;
					case "<":
						return value < filter.value;
					case "≤":
						return value <= filter.value;
					case "Starts With":
						return value.indexOf(filter.value) == 0;
					case "Contains":
						return value.indexOf(filter.value) > -1;
					default:
						return false;
				}
			});
		}else return true;
	}
}