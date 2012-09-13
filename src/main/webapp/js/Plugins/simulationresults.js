if (!ORYX.Plugins) 
    ORYX.Plugins = {};

if (!ORYX.Config)
	ORYX.Config = {};

ORYX.Plugins.SimulationResults = Clazz.extend({
	construct: function(facade){
		this.facade = facade;
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_SIMULATION_SHOW_RESULTS, this.showSimulationResults.bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_SIMULATION_DISPLAY_GRAPH, this.showGraph.bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_SIMULATION_PATH_SVG_GENERATED, this.pathSvgGenerated.bind(this));
		this.resultsjson = "";
	},
	showSimulationResults: function(options) {
		Ext.getCmp('maintabs').setActiveTab(1);
		var loadMask = new Ext.LoadMask(Ext.getBody(), {msg:"Generating Simulation Charts..."});
		loadMask.show();
		this.updateSimView(options);
		loadMask.hide();
	},
	showGraph: function(options) {
		if(options && options.value) {
			var selectedNode = options.value;
			if(selectedNode.id.startsWith("pgraph:")) {
				var valueParts = selectedNode.id.split(":");
        		var nodeid = valueParts[1];
        		if(nodeid == "processaverages") {
        			this.showProcessAveragesGraph(nodeid, this.resultsjson);
        		}
			} else if(selectedNode.id.startsWith("htgraph:")) {
				var valueParts = selectedNode.id.split(":");
        		var nodeid = valueParts[1];
        		this.showHumanTaskAveragesGraph(nodeid, this.resultsjson);
			} else if(selectedNode.id.startsWith("tgraph:")) {
				var valueParts = selectedNode.id.split(":");
        		var nodeid = valueParts[1];
        		this.showTaskAveragesGraph(nodeid, this.resultsjson);
			} else if(selectedNode.id.startsWith("pathgraph:")) {
				var valueParts = selectedNode.id.split(":");
        		var pathid = valueParts[1];
        		this.showPathGraph(pathid, this.resultsjson);
			}
		}
	},
	_showProcessGraphs: function(nodeid) {
		this.showProcessAveragesGraph(nodeid, this.resultsjson);
	},
	updateSimView: function(options) {
		this.createGraphsTree(options);
	},
	createGraphsTree: function(options) {
		var graphList = new Ext.tree.TreeNode({});
		var graphType;
		var graphTypeChild;
		this.resultsjson = options.results;
		var processSimInfo = jsonPath(options.results.evalJSON(), "$.processsim.*");
		if(processSimInfo) {
			graphType = new Ext.tree.TreeNode({
				text:"Process", 			
				allowDrag:false,
	    		allowDrop:false,           
	            expanded: true,
	            isLeaf: false,
				singleClickExpand:true});
			graphTypeChild = new Ext.tree.TreeNode({
				id:"pgraph:processaverages",
				text:processSimInfo[0].name + " (" + processSimInfo[0].id + ")",
				allowDrag:false,
	    		allowDrop:false,           
	            expanded: true,
	            isLeaf: true,
	            iconCls: 'xnd-icon',
	            icon: ORYX.PATH + 'images/simulation/diagram.png',
				singleClickExpand:true});
			graphType.appendChild(graphTypeChild);
			graphList.appendChild(graphType);
		}
		var htSimInfo = jsonPath(options.results.evalJSON(), "$.htsim.*");
		var taskSimInfo = jsonPath(options.results.evalJSON(), "$.tasksim.*");
		if(htSimInfo || taskSimInfo) {
			graphType = new Ext.tree.TreeNode({
				text:"Activities", 			
				allowDrag:false,
	    		allowDrop:false,           
	            expanded: true,
	            isLeaf: false,
				singleClickExpand:true});
			for (var i = 0; i < htSimInfo.length; i++) {
				var nextHt = htSimInfo[i];
					graphTypeChild = new Ext.tree.TreeNode({
						id:"htgraph:" + nextHt.id,
						text:nextHt.name + " (" + nextHt.id + ")", 			
						allowDrag:false,
			    		allowDrop:false,           
			            expanded: true,
			            isLeaf: true,
			            iconCls: 'xnd-icon',
			            icon: ORYX.PATH + 'images/simulation/activities/User.png',
						singleClickExpand:true});
				    graphType.appendChild(graphTypeChild);
			}
			for (var j = 0; j < taskSimInfo.length; j++) {
				var nextTask = taskSimInfo[j];
				// find the task type
				this.taskType = "";
				this.findTaskType(nextTask.id);
				this.taskType.replace(/\s/g, "");
			    graphTypeChild = new Ext.tree.TreeNode({
					id:"tgraph:" + nextTask.id,
					text:nextTask.name + " (" + nextTask.id + ")", 				
					allowDrag:false,
		    		allowDrop:false,           
		            expanded: true,
		            isLeaf: true,
		            iconCls: 'xnd-icon',
		            icon: ORYX.PATH + 'images/simulation/activities/' + this.taskType + '.png',
					singleClickExpand:true});
			    
			    graphType.appendChild(graphTypeChild);
			}
			graphList.appendChild(graphType);
		}
		var pathSimInfo = jsonPath(options.results.evalJSON(), "$.pathsim.*");
		if(pathSimInfo) {
			graphType = new Ext.tree.TreeNode({
				text:"Paths", 			
				allowDrag:false,
	    		allowDrop:false,           
	            expanded: true,
	            isLeaf: false,
				singleClickExpand:true});
			for (var i = 0; i < pathSimInfo.length; i++) {
				var nextPath = pathSimInfo[i];
					graphTypeChild = new Ext.tree.TreeNode({
						id:"pathgraph:" + nextPath.id,
						text:"Path " + (i+1) + " (" + nextPath.id + ")", 			
						allowDrag:false,
			    		allowDrop:false,           
			            expanded: true,
			            isLeaf: true,
			            iconCls: 'xnd-icon',
			            icon: ORYX.PATH + 'images/simulation/pathicon.png',
						singleClickExpand:true});
				    graphType.appendChild(graphTypeChild);
			}
			graphList.appendChild(graphType);
		}
		
		Ext.getCmp('simresultscharts').setRootNode(graphList);
		Ext.getCmp('simresultscharts').getRootNode().render();
		Ext.getCmp('simresultscharts').render();
		
		// select process graph and show its chart
		var tp = Ext.getCmp('simresultscharts');
		var node = tp.getNodeById("pgraph:processaverages");
	    node.select();
	    this._showProcessGraphs("processaverages");
	},
	findTaskType: function(taskid) {
		ORYX.EDITOR._canvas.getChildren().each((function(child) {
			this.isTaskType(child, taskid);
		}).bind(this));
	},
	isTaskType: function(shape, taskid) {
		if(shape instanceof ORYX.Core.Node) {
			if(shape.resourceId == taskid && shape.properties["oryx-tasktype"]) {
				this.taskType = shape.properties["oryx-tasktype"];
			}
			if(shape.getChildren().size() > 0) {
				for (var i = 0; i < shape.getChildren().size(); i++) {
					if(shape.getChildren()[i] instanceof ORYX.Core.Node) {
						this.isTaskType(shape.getChildren()[i], taskid);
					}
				}
			}
		}
	},
	showProcessAveragesGraph : function(nodeid, jsonstr) {
		var jsonObj = jsonPath(jsonstr.evalJSON(), "$.processsim.*");
		var jsonSimObj = jsonPath(jsonstr.evalJSON(), "$.timeline");
		var jsonInstancesObj = jsonPath(jsonstr.evalJSON(), "$.activityinstances.*");
		var jsonEventAggregationsObj = jsonPath(jsonstr.evalJSON(), "$.eventaggregations.*");
		var jsonSimObjWrapper = {
			"timeline": jsonSimObj[0]
		};
		ORYX.EDITOR.simulationChartData = jsonObj;
		ORYX.EDITOR.simulationEventData = jsonSimObjWrapper;
		ORYX.EDITOR.simulationEventAggregationData = jsonEventAggregationsObj;
		ORYX.EDITOR.simulationInstancesData = jsonInstancesObj;
		ORYX.EDITOR.simulationChartTitle = "Process Simulation Results";
		ORYX.EDITOR.simulationChartId = jsonObj[0].id;
		ORYX.EDITOR.simulationChartNodeName = jsonObj[0].name;
		Ext.getDom('simchartframe').src = ORYX.PATH + "simulation/processchart.html";

	},
	showTaskAveragesGraph : function(nodeid, jsonstr) {
		var taskobj = jsonPath(jsonstr.evalJSON(), "$.tasksim.*");
		for(var j=0; j < taskobj.length; j++) {
			var inner = taskobj[j];
			if(inner.id == nodeid) {
				var innerWrapper = [];
				innerWrapper[0] = inner;
				ORYX.EDITOR.simulationChartData = innerWrapper;
				ORYX.EDITOR.simulationEventData = innerWrapper[0].timeline;
				ORYX.EDITOR.simulationChartTitle = "Task Simulation Results";
				ORYX.EDITOR.simulationChartId = innerWrapper[0].id;
				ORYX.EDITOR.simulationChartNodeName = innerWrapper[0].name;
				Ext.getDom('simchartframe').src = ORYX.PATH + "simulation/taskchart.html";
			}
		}
	},
	showHumanTaskAveragesGraph : function(nodeid, jsonstr) {
		var htobj = jsonPath(jsonstr.evalJSON(), "$.htsim.*");
		for(var i=0; i < htobj.length; i++ ) {
			var inner = htobj[i];
			if(inner.id == nodeid) {
				ORYX.EDITOR.simulationChartData = inner;
				ORYX.EDITOR.simulationEventData = inner.timeline;
				ORYX.EDITOR.simulationChartTitle = "Human Task Simulation Results";
				ORYX.EDITOR.simulationChartId = inner.id;
				ORYX.EDITOR.simulationChartNodeName = inner.name;
				Ext.getDom('simchartframe').src = ORYX.PATH + "simulation/humantaskchart.html";
			}
		}
	},
	showPathGraph : function(pathid, jsonstr) {
		var pathobj = jsonPath(jsonstr.evalJSON(), "$.pathsim.*");
		ORYX.EDITOR.simulationChartTitle = "Path Execution Info (" + pathid + ")";
		ORYX.EDITOR.simulationPathData = pathobj;
		ORYX.EDITOR.simulationPathId = pathid;
		
		this.facade.raiseEvent({
	            type: ORYX.CONFIG.EVENT_SIMULATION_BUILD_PATH_SVG,
	            pid: pathid
	    });
	},
	pathSvgGenerated : function() {
		ORYX.EDITOR.simulationPathSVG = DataManager.serialize(ORYX.EDITOR.getCanvas().getSVGRepresentation(false));
		Ext.getDom('simchartframe').src = ORYX.PATH + "simulation/pathschart.html";
		this.facade.raiseEvent({
            type: ORYX.CONFIG.EVENT_SIMULATION_CLEAR_PATH_SVG
		});
	}
	
});
