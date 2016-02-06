//provide closure
var initialize = function(){
	"use strict";
	var myMap = window.myMap = window.myMap || {};

	var map;
	require([
			"esri/map",
			"esri/layers/FeatureLayer",
			"esri/dijit/LocateButton",
			"esri/geometry/Point",
			"esri/symbols/SimpleMarkerSymbol",
			"esri/symbols/SimpleLineSymbol",
			"esri/symbols/SimpleFillSymbol",
			"esri/dijit/editing/TemplatePicker",
			"esri/dijit/Popup",
			"esri/dijit/PopupTemplate",
			"esri/Color",
			"esri/graphic",
			"esri/layers/GraphicsLayer",
			"esri/toolbars/draw",
			"esri/toolbars/edit",
			"esri/config",


			"dojo/_base/array",
			"dojo/_base/event",
			"dojo/_base/lang",
			"dojo/parser",
			"dijit/registry",
			"dojo/dom-class",
			"dojo/dom-construct",
			"dojo/dom",
			"dojo/on",
			"dojo/query",
			"dojo/domReady!",

			"dijit/TooltipDialog",
			"dijit/layout/BorderContainer",
			"dijit/layout/ContentPane",
			"dijit/form/Button"
		],



	function (Map,
			  	FeatureLayer,
			  	LocateButton,
				Point,
			  	SimpleMarkerSymbol,
				SimpleLineSymbol,
			  	SimpleFillSymbol,
			  	TemplatePicker,
				Popup,
				PopupTemplate,
				Color,
				Graphic,
				GraphicsLayer,
			  	Draw,
			  	Edit,
			  	esriConfig,

			  	arrayUtils,
			  	event,
			  	lang,
			  	parser,
			  	registry,
				domClass,
				domConstruct,
				dom,
				on,
				query,
			  	TooltipDialog) {

		var fill = new SimpleFillSymbol("solid", null, new Color("#A4CE67"));
		var popup = new Popup({
			fillSymbol: fill,
			titleInBody: false
		}, domConstruct.create("div"));
		//Add the dark theme which is customized further in the <style> tag at the top of this page
		domClass.add(popup.domNode, "dark");

		var map = new Map("map", {
			basemap: "topo",
			center: [GeoLocation.userLocation.lng, GeoLocation.userLocation.lat ],
			zoom: 4,
			infoWindow: popup
		});

		//set scale false here otherswise it zooms in so far it looks like the map is broken
		myMap.geoLocate = new LocateButton({
			map: map,
			setScale: false
		}, "LocateButton");
		myMap.geoLocate.startup();

		var template = new PopupTemplate({
			title: "{Name}",
			description: '' +
			'<p class="popupBody">' +
			'<span class="incidentName">{Name}</span><br>' +
			'<span class="incidentAcres"><b>Fire Id: </b>{FID}</span><br>' +
			'<span class="incidentAcres"><b>ID: </b>{Id}</span><br>' +
			'<span class="incidentAcres"><b>Acres: </b>{Acres}</span><br>' +
			'<span class="incidentNotes"><b>Notes: </b>{Notes}</span><br>' +
			'</p>'+
			'<div class="editIncident"><b class="glyphicon glyphicon-pencil "></b><span>Edit</span></div>' +
			'<div class="deleteIncident"><b class="glyphicon glyphicon-trash"></b><span>Delete</span></div>'
		});
		var modisLayer = new FeatureLayer("http://tmservices1.esri.com/arcgis/rest/services/LiveFeeds/MODIS_Thermal/MapServer/0");
		var fireLayer = new FeatureLayer("http://services1.arcgis.com/CHRAD8xHGZXuIQsJ/arcgis/rest/services/dev_challenge_ia/FeatureServer/0",{
			mode: FeatureLayer.MODE_SNAPSHOT,
			outFields: ["*"],
			infoTemplate: template,
			opacity: 0.5
		});
		map.addLayers([fireLayer,modisLayer]);
		map.on("layers-add-result", initEditing);

		function initEditing(evt) {
			console.log("initEditing", evt);
			var currentLayer = null;
			var layers = [];
			// only show editable layers in the toolbar
			arrayUtils.map(evt.layers, function(result, k) {
				if(result.layer._editable === true) {
					return layers.push(result.layer);
				}
			});
			var editToolbar = new Edit(map);
			//editToolbar.on("deactivate", function(evt) {
			//	console.log("current", currentLayer);
			//	currentLayer.applyEdits(null, [evt.graphic], null);
			//});

			arrayUtils.forEach(layers, function(layer) {
				var editingEnabled = false;
				layer.on("dbl-click", function(evt) {
					event.stop(evt);
					if (editingEnabled === false) {
						editingEnabled = true;
						editToolbar.activate(Edit.EDIT_VERTICES , evt.graphic);
					} else {
						currentLayer = this;
						editToolbar.deactivate();
						editingEnabled = false;
					}
				});

				layer.on("click",function(evt) {

					chooseEdit(layer, evt);
					console.log("layer...", layer);

					//event.stop(evt);
					//if (evt.ctrlKey === true || evt.metaKey === true) {  //delete feature if ctrl key is depressed
					//	layer.applyEdits(null,null,[evt.graphic]);
					//	currentLayer = this;
					//	editToolbar.deactivate();
					//	editingEnabled=false;
					//}
				});
			});

			function chooseEdit(layer, event){
				var feature = event;
				var $map = $("#map")
				$map.on("click", '.deleteIncident', function(){
					map.infoWindow.hide();
					layer.applyEdits(null, null, [feature.graphic]);
				});
				$map.on("click", '.editIncident', function(){
					var $modal = $("#addIncidentModal");
					var attrs = feature.graphic.attributes;
					$modal.find("#id").val(attrs.Id);
					$modal.find("#name").val(attrs.Name);
					$modal.find("#acres").val(attrs.Acres);
					$modal.find("#notes").val(attrs.Notes);
					$modal.modal("show");
					$(".newIncidentForm").submit(function(e){
						e.preventDefault();
						var formObj = JSON.stringify($('.newIncidentForm').serializeObject());
						var edits = JSON.parse(formObj);
						edits.FID = attrs.FID;
						feature.graphic.attributes = edits;
						feature.graphic.getLayer().applyEdits(null, [feature.graphic], null);
						//map.infoWindow.refresh();
						$modal.modal('hide')
					});
				});
			}
			var templatePicker = new TemplatePicker({
				featureLayers: layers,
				rows: "auto",
				columns: 2,
				grouping: true,
				style: "height: auto; overflow: auto;"
			}, "templatePickerDiv");

			templatePicker.startup();

			var drawToolbar = new Draw(map);

			var selectedTemplate;
			templatePicker.on("selection-change", function() {
				if( templatePicker.getSelected() ) {
					selectedTemplate = templatePicker.getSelected();
				}
				drawToolbar.activate(Draw.POINT);

			});
			// adding a new incident
			drawToolbar.on("draw-end", function(evt) {
				drawToolbar.deactivate();
				editToolbar.deactivate();
				var newAttributes = lang.mixin({}, selectedTemplate.template.prototype.attributes);
				$("#addIncidentModal").modal("show");
				$(".newIncidentForm").submit(function(e){
					e.preventDefault();
					var formObj = JSON.stringify($('.newIncidentForm').serializeObject());
					newAttributes = JSON.parse(formObj);
					var newGraphic = new Graphic(evt.geometry, null, newAttributes);
					$("#addIncidentModal").modal('hide');
					selectedTemplate.featureLayer.applyEdits([newGraphic], null, null);
				});
			});
		}

//============================================================================================================
//============================================================================================================

		//$modal.find("#latitude").val(incident.location.lat);
		//$modal.find("#id").val(incident.location.lng);
		//$modal.find("#name").val(incident.name);
		//$modal.find("#acres").val(incident.acres);
		//$modal.find("#notes").val(incident.comments);


		//$(".newIncidentForm").submit(function(e){
		//	e.preventDefault();
		//	console.log("submitting form");
		//	var formObj = JSON.stringify($('.newIncidentForm').serializeObject());
		//	$("#addIncidentModal").modal('hide');
		//	console.log(formObj)
		//});



		//function addNewIncident(obj, id) {
		//	id = id || false;
		//	var incidentDetails = new myMap.IncidentDetails(JSON.parse(obj));
		//	var incidentRef = id ? id : myMap.incidentCount;
		//	var ref = new Firebase("https://firewhat.firebaseio.com/"+incidentRef);
		//	if(id !== false) {
		//		console.log("updating...")
		//		ref.update(incidentDetails)
		//		// firebase ref on child_updated should take care of the rest
        //
		//	} else {
		//		console.log("creating...")
		//		ref.set(incidentDetails);
		//		// firebase ref on child_added should take care of the rest
		//	}
		//}



		$.fn.serializeObject = function() {
			var o = {};
			var a = this.serializeArray();
			$.each(a, function() {
				if (o[this.name] !== undefined) {
					if (!o[this.name].push) {
						o[this.name] = [o[this.name]];
					}
					o[this.name].push(this.value || '');
				} else {
					o[this.name] = this.value || '';
				}
			});
			return o;
		};

		//function editIncident(){
		//	var $modal = $("#addIncidentModal");
		//	ref.once("value", function(snapshot) {
		//		var incident = snapshot.val();
        //
        //
		//	}, function (errorObject) {
		//		console.log("The read failed: " + errorObject.code);
		//	});
		//	$modal.modal('show');
		//	$(".newIncidentForm").off().submit(function(e){
		//		e.preventDefault();
		//		var obj = JSON.stringify($('.newIncidentForm').serializeObject());
		//		addNewIncident(obj, id);
		//		$("#addIncidentModal").modal('hide');
		//		console.log("here");
		//	});
		//}

//============================================================================================================
//============================================================================================================








		dojo.query("#layer_list > input[type=checkbox]").connect("onclick", function () {
			var checkBox = dom.byId(this).id;
			if(checkBox === "modisLayerCheckbox") {
				modisLayer.setVisibility(!modisLayer.visible);
			}
			else if(checkBox === "fireLayerCheckbox") {
				fireLayer.setVisibility(!fireLayer.visible);
			}
		});

		//namespace some utility functions
		myMap.utilities = function() {
			var locateUser = function() {
				console.log("setting s")
				//map.setExtent(extent);
			};

			return {
				locateUser : locateUser,
			}
		}();
	});
};



var GeoLocation = (function(callback) {
	var options = {
		enableHighAccuracy : true,
		timeout : 500
	};
	function getLocation(position) {
		console.log(position);
		document.cookie = "geoLocation=true";
		GeoLocation.userLocation = {
			lat: position.coords.latitude,
			lng: position.coords.longitude };
		callback()

	}
	function fallback() {
		$.getJSON('//freegeoip.net/json/', function (data) {
			console.log("using fallback location")
			console.log(data)
			// sometimes ClientLocation comes back null
			GeoLocation.userLocation = {
				lng: data.longitude,
				lat: data.latitude
			};
			callback()

		}).fail(function() {
			console.log('geolocation failed resorting to default.');
			GeoLocation.userLocation = {
				lng: -97.367445640979,
				lat: 42.877742
			};
			callback()

		});
	}

	function error(error) {
		document.cookie = "geoLocation=false";
		console.log(error.message);
		fallback();
	}

	navigator.geolocation.getCurrentPosition(getLocation, fallback, options);

	return {
		//setting default
		userLocation : {
			lng: -97.367445640979,
			lat: 42.877742
		}
	}

})(initialize);


//helper function to turn form into object of key/val's

////helper function to clear modal upon closing
//$("#addIncidentModal").on('hidden.bs.modal', function (e) {
//	$(".newIncidentForm").find("input[type=text], textarea").val("");
//});
