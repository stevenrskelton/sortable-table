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
		{ title:'Starts With', op:'Starts With', datatype:'string' },
		{ title:'Contains', op:'Contains', datatype:'string' }
	],
	getFilterOps: function(column){
		return this.filterOps.filter(function(element){
			return !element.datatype || element.datatype === column.datatype;
		}).map(function(element){
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
	createFilter: function(e,i,o){
		e.stopPropagation();
		var dropdown = o.querySelector('.dropdown-menu');
		if(dropdown && dropdown.style.display == 'none') dropdown.toggle();
		o.classList.toggle('open');
	},
	addFilterReturn: function(e,i,o){
		if(e.keyCode === 13) this.addFilter(e,i,o);
	},
	addFilter: function(e,i,o){
		var self = this;
		var dropdown = o;
		while(!dropdown.classList.contains('dropdown-menu')) dropdown = dropdown.parentElement;
		[].forEach.call(dropdown.querySelectorAll('input[type="text"]'),function(input){
			if(input.value!==''){
				var op = input.getAttribute('data-op') || o.getAttribute('data-op');
				var model = o.templateInstance.model;
				if(!model.column.filters) model.column.filters = [];
				model.column.filters.push({op: op, value: input.value});
				if(self.dataSource) self.dataSource.filters = self.generateColumnFilters();
				self.forceFilterRefresh++;
			}
		});
		this.closeFilter(e,i,o);
	},
	removeFilter: function(e,i,o){
		var model = o.templateInstance.model;
		var index = model.column.filters.indexOf(model.filter);
		model.column.filters.splice(index, 1);
		if(this.columns.every(function(column){
			return !column.filters || column.filters.length === 0;
		})) this.forceFilterRefresh = 0;
		else this.forceFilterRefresh++;
		if(this.dataSource) this.dataSource.filters = this.generateColumnFilters();
	},
	closeFilter: function(e,i,o){
		e.stopPropagation();
		var dropdown = o;
		while(!dropdown.classList.contains('dropdown-menu')) dropdown = dropdown.parentElement;
		if(dropdown.opened) dropdown.toggle();
		if(dropdown.parentElement.classList.contains('open')) dropdown.parentElement.classList.remove('open');
		[].forEach.call(dropdown.querySelectorAll('input[type="text"]'),function(input){
			if(input.value!=='') input.value = '';
		});
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
	},
	setFiltersWidth: function(e,i,o){
		this.updateColumnWidths();
		this.createFilter(e,i,o.parentElement);
		var dropdown = o;
		while(dropdown.querySelectorAll('.dropdown-menu').length===0) dropdown = dropdown.parentElement;
		dropdown = dropdown.querySelectorAll('.dropdown-menu')[0];
		var allDropDowns = dropdown.parentElement.parentElement.parentElement.querySelectorAll('.dropdown-menu');
		[].forEach.call(allDropDowns, function(dd){
			if(dd !== dropdown){
				[].forEach.call(dd.querySelectorAll('input[type="text"]'),function(input){
					if(input.value!=='') input.value = '';
				});
				if(dd.opened) dd.toggle();
				if(dd.parentElement.classList.contains('open')) dd.parentElement.classList.remove('open');
			}
		});
		[].forEach.call(dropdown.querySelectorAll('input[type="text"]'),function(input){
			var model = input.templateInstance.model;
			var width = Math.min(200, model.column.width - 8);
			input.style.width = width + 'px';
		});
	}
}