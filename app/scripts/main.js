//provide closure
var initialize = function(){
	"use strict";
	var myMap = window.myMap = window.myMap || {};

	var map;
	require([
			"esri/map",
			"esri/layers/FeatureLayer",
			"esri/geometry/Point",
			"esri/symbols/SimpleMarkerSymbol",
			"esri/graphic",
			"esri/layers/GraphicsLayer",
			"esri/layers/ImageParameters",
			"dojo/dom",
			"dojo/on",
			"dojo/query",
			"dojo/domReady!"
		],

	function (Map, FeatureLayer, Point, SimpleMarkerSymbol, Graphic, GraphicsLayer, ImageParameters, dom, on, query) {
		var layer, visibleLayerIds = [];

		var map = new Map("map", {
			basemap: "topo",
			center: [GeoLocation.userLocation.lng, GeoLocation.userLocation.lat ],
			zoom: 10
		});


		var gl = new GraphicsLayer();
		var p = new Point(GeoLocation.userLocation.lng, GeoLocation.userLocation.lat);
		var s = new SimpleMarkerSymbol().setStyle(SimpleMarkerSymbol.STYLE_CROSS).setSize(20);
		var g = new Graphic(p, s);
		gl.add(g);
		map.addLayer(gl);


		var fireLayer = new FeatureLayer("http://services1.arcgis.com/CHRAD8xHGZXuIQsJ/arcgis/rest/services/dev_challenge_ia/FeatureServer/0");
		var modisLayer = new FeatureLayer("http://tmservices1.esri.com/arcgis/rest/services/LiveFeeds/MODIS_Thermal/MapServer/0");
		map.addLayer(fireLayer);
		map.addLayer(modisLayer);

		dojo.query("#layer_list > input[type=checkbox]").connect("onclick", function (ev) {
			console.log(dom.byId(this));
			console.log(ev)
			console.log("checking....")
			console.log(fireLayer)
			fireLayer.setVisibility(!fireLayer.visible);
		});

		//namespace some utility functions
		myMap.utilities = function() {
			var locateUser = function() {
				console.log("setting s")
				//map.setExtent(extent);
			};

			return {
				locateUser : locateUser
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



