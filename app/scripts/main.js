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
			center: [GeoLocation.userLocation.lng, GeoLocation.userLocation.lat],
			zoom: 6,
			infoWindow: popup
		});

		//set scale false here otherwise it zooms in so far it looks like the map is broken
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
			mode: FeatureLayer.MODE_ONDEMAND,
			outFields: ["*"],
			infoTemplate: template,
			opacity: 0.5
		});
		map.addLayers([fireLayer,modisLayer]);
		var drawToolbar = new Draw(map);
		map.on("layers-add-result", initEditing);

		function initEditing(evt) {
			 myMap.editingEnabled = false;
			var layers = [];
			// only show editable layers in the toolbar
			arrayUtils.map(evt.layers, function(result) {
				if(result.layer._editable === true) {
					return layers.push(result.layer);
				}
			});
			arrayUtils.forEach(layers, function(layer) {
				layer.on("click",function(evt) {
					chooseEdit(layer, evt);
				});
			});

			function chooseEdit(layer, event){
				var feature = event;
				var $map = $("#map");
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
						submitForm(feature, "edit")
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

			var selectedTemplate;
			templatePicker.on("selection-change", function() {
				if( templatePicker.getSelected() ) {
					selectedTemplate = templatePicker.getSelected();
					console.log(selectedTemplate);
				}
				drawToolbar.activate(Draw.POINT);

			});
			// adding a new incident
			drawToolbar.on("draw-end", function(evt) {
				if (myMap.editingEnabled === false) {
					myMap.editingEnabled = true;
					drawToolbar.activate(Draw.POINT);
				} else {
					drawToolbar.deactivate();
					myMap.editingEnabled = false;
				}
				drawToolbar.deactivate();
				$("#addIncidentModal").modal("show");
				$(".newIncidentForm").submit(function(e){
					e.preventDefault();
					submitForm(evt);
				});
				$("#addIncidentModal").on("click", "#discard,  #close", function(e){
					console.log("exit!")
				})
			});
			function submitForm(feature, f){
				if($('input[name="Name"]').val() === "") {
					$("#validationMessage").show().text("A name is required");
					return false;
				}
				$("#validationMessage").hide();
				var formObj = JSON.stringify($('.newIncidentForm').serializeObject());
				var attributes = JSON.parse(formObj);
				if(f === "edit") {
					attributes.FID = feature.graphic.attributes.FID;
					feature.graphic.attributes = attributes;
					feature.graphic.getLayer().applyEdits(null, [feature.graphic], null);
					map.infoWindow.hide();
				} else {
					var newAttributes = lang.mixin({}, selectedTemplate.template.prototype.attributes);
					newAttributes = attributes;
					var newGraphic = new Graphic(feature.geometry, null, newAttributes);
					selectedTemplate.featureLayer.applyEdits([newGraphic], null, null)
				}
				$("#addIncidentModal").modal('hide');
			};
		}













		//toggle layers
		dojo.query("#layer_list > input[type=checkbox]").connect("onclick", function () {
			var checkBox = dom.byId(this).id;
			if(checkBox === "modisLayerCheckbox") {
				modisLayer.setVisibility(!modisLayer.visible);
			}
			else if(checkBox === "fireLayerCheckbox") {
				fireLayer.setVisibility(!fireLayer.visible);
			}
		});

	});
};



var GeoLocation = (function(callback) {
	var options = {
		enableHighAccuracy : true,
		timeout : 1000
	};
	function getLocation(position) {
		console.log(position);
		document.cookie = "geoLocation=true";
		GeoLocation.userLocation = {
			lat: position.coords.latitude,
			lng: position.coords.longitude };
		callback()

	}
	function fallback(error) {
		console.log("GeoLoacation Error:", error.message);
		$.getJSON('//freegeoip.net/json/', function (data) {
			console.log("using fallback location");
			GeoLocation.userLocation = {
				lng: data.longitude,
				lat: data.latitude
			};
			callback()

		}).fail(function() {
			console.log('geolocation failed resorting to default.');
			callback()

		});
	}
	if (navigator && navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(getLocation, fallback, options);
	} else {
		fallback();
	}

	return {
		//setting default
		userLocation : {
			lng: -121.904297,
			lat: 42.0390942
		}
	}

})(initialize);

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

//helper function to clear modal upon closing
$("#addIncidentModal").on('hidden.bs.modal', function (e) {
	$(".newIncidentForm").find("input, textarea").val("");
});
