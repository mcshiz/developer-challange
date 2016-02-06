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
			"esri/dijit/Popup",
			"esri/dijit/PopupTemplate",
			"esri/Color",
			"esri/graphic",
			"esri/layers/GraphicsLayer",
			"esri/symbols/SimpleFillSymbol",
			"dojo/dom-class",
			"dojo/dom-construct",
			"dojo/dom",
			"dojo/on",
			"dojo/query",
			"dojo/domReady!",
			"dijit/TooltipDialog"
		],



	function (Map, FeatureLayer,LocateButton, Point, SimpleMarkerSymbol, SimpleLineSymbol, Popup, PopupTemplate, Color, Graphic, GraphicsLayer,SimpleFillSymbol, domClass, domConstruct,  dom, on, query, TooltipDialog) {

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
			zoom: 7,
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
		var fireLayer = new FeatureLayer("http://services1.arcgis.com/CHRAD8xHGZXuIQsJ/arcgis/rest/services/dev_challenge_ia/FeatureServer/0",{
			mode: FeatureLayer.MODE_ONDEMAND,
			outFields: ["*"],
			infoTemplate: template,
			opacity: 0.5
		});

		var modisLayer = new FeatureLayer("http://tmservices1.esri.com/arcgis/rest/services/LiveFeeds/MODIS_Thermal/MapServer/0");
		map.addLayer(fireLayer);
		map.addLayer(modisLayer);


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
			console.log("failed")
			console.log(data)
			// sometimes ClientLocation comes back null
			GeoLocation.userLocation = {
				lng: data.longitude,
				lat: data.latitude
			};

		}).fail(function() {
			console.log('geolocation failed resorting to default.');
			GeoLocation.userLocation = {
				lng: -97.367445640979,
				lat: 42.877742
			}
		}).done(function(){
			callback()
		})
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



