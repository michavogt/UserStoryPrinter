Ext.define('CustomApp', {
	extend: 'Rally.app.App',      
	requires: [
		'Rally.data.wsapi.Store',
		'Rally.app.plugin.Print'
	],
	plugins: [{
		ptype: 'rallyappprinting'
	}],
	componentCls: 'printcards',
	items: [      
    	{
        	xtype: 'container', 
        	itemId: 'pulldown-container',
        	layout: {
                type: 'vbox',          
                align: 'stretch'
            }
      	},
    	{
        	xtype: 'container', 
        	itemId: 'textfield-container',
        	layout: {
                type: 'hbox',           
                align: 'stretch'
            }
      	},
    	{
        	xtype: 'container', 
        	itemId: 'button-container'
      	}
    ],
	
	selectedRelease: undefined,
	featureStore: undefined,
	featureComboBox: undefined,
	storyStore: undefined,
	selectedFeature: undefined,
	storyGrid: undefined,
	storyNameFilterTextField: undefined,
	setFilterButton: undefined,

	launch: function() {
    	var me = this;                     // convention to hold a reference to the 'app' itself; reduce confusion of 'this' all over the place; when you see 'me' it means the 'app'
		
		var releaseComboBox = {
			xtype: 'rallyreleasecombobox',
			itemId: 'release-combobox',    
			maxWidth: 400,
			fieldLabel: 'Release',
			labelAlign: 'right',
			listeners: {
				ready: function(combobox) {
					console.log('releaseCombox event ready: -> _loadFeatures');
					me._loadFeatures(combobox.getRecord());
				},
				select: function(combobox) {
					console.log('releaseCombox event select: -> _loadFeatures');
					me._loadFeatures(combobox.getRecord());
				},          
				scope: me
			}
        };
        me.down('#pulldown-container').add(releaseComboBox);  
		console.log('added release-combobox');
	},

    _loadFeatures: function(release) {
		var me = this;
		console.log('_loadFeatures entered');
		me.selectedRelease = release;
		console.log('selected release', release.data.Name);
		
		// if store exists, just load new data
		if (me.featureStore) {
			console.log('featureStore exists, just load new data');
			me.featureStore.setFilter(me._getReleaseFilter(release.data.Name));
			me.featureStore.load();
			return;
		}
		console.log('new featureStore created');
		me.featureStore = Ext.create('Rally.data.wsapi.Store', {   
			xtype: 'rallywsapidatastore',
			model: 'PortfolioItem/Feature',
			autoLoad: true,
			context: {
				project : "/project/7048691823",
				projectScopeUp : false,
				projectScopeDown : true
			},	
			filters: me._getReleaseFilter(release.data.Name),	
			listeners: {
				load: function(store) {
					console.log('featureStore event loaded: -> _selectFeature');
					me._selectFeature(store);
				},
				scope: me                        
			},
			fetch: ['FormattedID','Name','UserStories','Release']
		});
	},

    // create and load feature pulldown 
    _selectFeature: function(featureStore) {
        var me = this;
		console.log('_selectFeature entered');

		if (me.featureComboBox) { 
			console.log('featureCombobox exists');
			//console.log(me.featureComboBox);
			// !!!! todo !!!!! hier noch irgendeine update funktion, um event ready: zu provozieren
			//me.featureComboBox.update(featureStore);
			return;
		}
		
		me.featureComboBox =  Ext.create('Rally.ui.combobox.ComboBox', {
			xtype: 'rallycombobox',
			itemId: 'feature-combobox',  
			maxWidth: 400,
			fieldLabel: 'Feature',
			labelAlign: 'right',
			store: featureStore,
			displayField: 'FormattedID',
			listeners: {
				ready: function(combobox) {
					console.log('featureCombobox event ready: -> _loadStories');
					me.selectedFeature = combobox.getRecord();
					me._loadStories(me.selectedFeature);
				},
				select: function(combobox) {
					console.log('featureCombox event select: -> _loadStories');
					me.selectedFeature = combobox.getRecord();
					me._loadStories(me.selectedFeature);
				},
				scope: me
			}
        });
        me.down('#pulldown-container').add(me.featureComboBox); 
		console.log('added feature-combobox');

		me.storyNameFilterTextField = Ext.create('Rally.ui.TextField', {
			xtype: 'rallytextfield',
			itemId: 'storyNameFilter-TextField',     
			width: 400,
			fieldLabel: 'US Name contains:'
		});
        me.down('#textfield-container').add(me.storyNameFilterTextField); 
		console.log('added storyNameFilter-TextField');
		
		function filterStories(callBack) {
			var filter = me.storyNameFilterTextField.getValue().toUpperCase();
			var len = me.storyStore.data.items.length;
			
			for (var idx = 0; idx < len; idx++) {
				if (me.storyStore.data.items[idx].data.Name.toUpperCase().indexOf(filter) < 0) {
					if (me.storyGridSelectionCheckBoxes.isSelected(idx)) {
						me.storyGridSelectionCheckBoxes.deselect(idx, true);
					} 
				}
			}
		    if (callBack) { callBack(); }
		}

		me.setFilterButton = {
			xtype: 'rallybutton',
			itemId: 'setfilter-button',     
			text: 'Apply US Filter',
			region: 'center',
			handler: function() {
				console.log('store data', me.storyStore.data);
				console.log('checkboxes', me.storyGridSelectionCheckBoxes);

				me.down('#button-container').setLoading('Please wait...'); 
				
				// without defer filterStories() lets the browser not enough breath to display .setLoading('Please wait...')
				Ext.Function.defer(function() {
					filterStories(function() { me.down('#button-container').setLoading(false); });
		        }, 10);
			},
			scope: me
		};
        me.down('#button-container').add(me.setFilterButton); 
		console.log('added setfilter-button');
		
		me.printButton = {
			xtype: 'rallybutton',
			itemId: 'print-button',     
			text: 'Generate Story Cards',
			region: 'center',
			handler: function() {
				me._printCards();
			},
			scope: me
		};
        me.down('#button-container').add(me.printButton); 
		console.log('added print-button');
	},

	
	 _loadStories: function(feature) {
		var me = this;
		console.log('_loadStories entered');
		me.selectedFeature = feature;
		console.log('selected feature', feature.data.FormattedID);

		if (me.storyStore) {
			console.log('storyStore exists, just load new data');
			me.storyStore.setFilter(me._getFeatureFilter(feature.data.FormattedID));
			me.storyStore.load();
			return;
		}

		console.log('new storyStore created');
		me.storyStore = Ext.create('Rally.data.wsapi.Store', {
			model: 'User Story',
			autoLoad: true,
			pageSize: 1000,
			filters: me._getFeatureFilter(feature.data.FormattedID),	
			context: {
				project : "/project/7048691823",
				projectScopeUp : false,
				projectScopeDown : true
			},	
			listeners: {
				load: function(store) {
					console.log('storyStore event load: (does nothing if storyGrid exists)');
					if (!me.storyGrid) {
						me._createGrid(store);
					}
				},
				scope: me                        
			},
			fetch: ["FormattedID", "Feature", "Project", "Name", "Owner", "Description", "PlanEstimate"]
		});
	},
	
    // Create and show the grid of user stories
    _createGrid: function(storyStore) {
		var me = this;

		me.storyGridSelectionCheckBoxes = Ext.create('Ext.selection.CheckboxModel', {
			injectCheckbox: 1,
			allowDeselect: true,
			pruneRemoved: true,
			mode: 'MULTI'/*,
			listeners: {
				selectionchange: function( model, selected ) {
					console.log('Grid selectionchange: event');
				},
				scope: me
			}*/
		});

		me.storyGrid = {
			xtype: 'rallygrid',
			itemId: 'story-grid',
			id: 'grid',
			store: storyStore,
			selModel: me.storyGridSelectionCheckBoxes,
			columnCfgs: [         
				'FormattedID', 'Name', 'Owner' 
			],
			listeners: {
				boxready: function() {
					console.log('storyGrid boxready: event');
					me.storyGridSelectionCheckBoxes.selectAll();
				},
				load: function() {
					console.log('storyGrid load: event');
					me.storyGridSelectionCheckBoxes.selectAll();
				},
				scope: me
			}
		};

		me.add(me.storyGrid);
    },

	_getReleaseFilter: function(releaseName) {
		var releaseFilter = Ext.create('Rally.data.wsapi.Filter', {
			property: 'Release.Name',
			operator: '=',
			value: releaseName
		});
		return releaseFilter;
	},

	_getFeatureFilter: function(featureFormattedID) {
		var featureFilter = Ext.create('Rally.data.wsapi.Filter', {
			property: 'Feature.FormattedID',
			operator: '=',
			value: featureFormattedID
		});
		return featureFilter;
	},

	getOptions: function() {
		return [
			this.getPrintMenuOption({title: 'Print Story Cards App'}) //from printable mixin
		];
	},

	_printCards: function() {
		var me = this;

		if (me.storyGridSelectionCheckBoxes.selected.length === 0) {
			Rally.ui.notify.Notifier.showWarning({message: 'No stories to print'});
			return;
		}
		me.removeAll();

		var printCardHtml = '';
		console.log('_printCards entered');
		me.add({
			xtype: 'container',
			itemId: 'cards'
		});

		me.down('#cards').getEl().setHTML('');
		_.each(me.storyGridSelectionCheckBoxes.selected.items, function(record, idx) {
			printCardHtml += Ext.create('Rally.apps.printcards.PrintCard').tpl.apply(record.data);
			if (idx%4 === 3) {
				printCardHtml += '<div class="pb"></div>';
			}
		}, me);
		Ext.DomHelper.insertHtml('beforeEnd', me.down('#cards').getEl().dom, printCardHtml);

		if(Rally.BrowserTest) {
			Rally.BrowserTest.publishComponentReady(me);
		}
	}
});