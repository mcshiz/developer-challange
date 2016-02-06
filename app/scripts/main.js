
var myMap = function (window, document, L, undefined) {
	'use strict';
	myMap.markers = [];
	//keeps track of the next available firebase reference
	myMap.incidentCount = 0;

	L.Icon.Default.imagePath = 'images/';

	/* create leaflet map */
	var map = L.map('map', {
		center: GeoLocation.userLocation,
		zoom: 10,
		scrollWheelZoom: false,
		dragging: false
	});


	var fire = L.AwesomeMarkers.icon({
		icon: 'glyphicon glyphicon-fire',
		markerColor: 'darkred',
		iconColor: 'darkred'
	});
	var userLocation = L.AwesomeMarkers.icon({
		icon: 'glyphicon glyphicon-map-marker',
		markerColor: 'cadetblue',
		iconColor: '#083972'

	});


		new L.marker(GeoLocation.userLocation, {icon: userLocation}).addTo(map)


	/* add stamen tile layer other layers include watercolor and toner */
	new L.tileLayer('http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.png', {
		minZoom: 0,
		maxZoom: 18,
		attribution: 'Map data © <a href="http://www.openstreetmap.org">OpenStreetMap contributors</a>'
	}).addTo(map);

	//click map to toggle zoom and drag (might want to consider doing this only for mobile)
	map.on('click', function() {
		map.scrollWheelZoom.enable();
		map.dragging.enable()
	});

	// add the add incident button
	var addIncidentButton = L.Control.extend({
		options: {
			position: 'topright'
		},
		onAdd: function (map) {
			var container = L.DomUtil.create('div', 'glyphicon glyphicon-fire text-center leaflet-bar leaflet-control leaflet-control-custom');
			container.style.width = 'auto';
			container.style.height = 'auto';
			container.dataset.toggle = "modal";
			container.dataset.target = "#addIncidentModal";
			return container;
		}
	});
	map.addControl( new addIncidentButton());

	myMap.IncidentDetails = function(i) {
		if(typeof(i.location) === "undefined") {
			this.location = {lat: i.latitude, lng: i.longitude};
		} else {
			this.location = {lat: i.location.lat, lng: i.location.lng};
		}
		this.name = i.name;
		this.acres = i.acres;
		this.comments = i.comments;
		this.hazards = i.hazards;
		this.radio = i.radio;
		this.resources = i.resources;
		this.roc = i.roc;
		this.ros = i.ros;
		this.structures = i.structures;
	};

	myMap.addMarker = function(i, ref){
		var incident = new myMap.IncidentDetails(i);
		var marker = new L.marker(incident.location, {icon: fire, id: ref}).addTo(map)
		var popupContent = '' +
			'<div class="editIncident" data-id="'+ref+'"><b class="glyphicon glyphicon-pencil "></b><span>Edit Incident</span></div>' +
			'<div class="deleteIncident" data-id="'+ref+'"><b class="glyphicon glyphicon-trash"></b><span>Delete Incident</span></div>' +
			'<p>' +
			'<span class="incidentName">'+incident.name+'</span><br>' +
			'<span class="incidentAcres"><b>Acres: </b>'+incident.acres+'</span><br>' +
			'<span class="incidentRos"><b>Ros: </b>'+incident.ros+'</span><br>' +
			'<span class="incidentRoc"><b>Roc: </b>'+incident.roc+'</span><br>' +
			'<span class="incidentStructures"><b>Structures: </b>'+incident.structures+'</span><br>' +
			'<span class="incidentHazards"><b>Hazards: </b>'+incident.hazards+'</span><br>' +
			'<span class="incidentResources"><b>Resources: </b>'+incident.resources+'</span><br>' +
			'<span class="incidentRadio"><b>Radio: </b>'+incident.radio+'</span><br>' +
			'<span class="incidentComments"><b>Comments: </b>'+incident.comments+'</span><br>' +
			'</p>';
		marker.bindPopup(popupContent);
		marker.on("popupopen", myMap.onPopupOpen);

		myMap.markers.push(marker);
	};

	myMap.listIncident = function(i, ref){
		var $list = $("#incidentList");
		$list.find('.loading').remove();
		$list.find('ul').append('<li onclick="myMap.showIncident(this)" data-ref="'+ref+'">'+ i.name+'</li>');
	};

	myMap.onPopupOpen = function() {
		var thisMarker = this;
		var id = thisMarker.options.id;

		$(".deleteIncident:visible").click(function () {
			var message = "Are you sure you want to delete this incident?";
			bootbox.confirm(message, function(response){
				if (response == true) {
					myMap.deleteMarker(thisMarker);
				}
			});
		});
		$(".editIncident:visible").click(function () {
			editIncident(id, thisMarker);
		});
	};

	myMap.deleteMarker = function(marker){
		var id = marker.options.id || marker;
		//remove from firebase
		var ref = new Firebase("https://firewhat.firebaseio.com/"+id);
		ref.remove();
		//remove from map
		map.removeLayer(marker);
		//remove from list
		$('.incidents ul').find("li[data-ref='" + id + "']").remove();
	};

	myMap.showIncident = function(i){
		var id = $(i).data("ref");
		var ref = new Firebase("https://firewhat.firebaseio.com/"+id);
		ref.on("value", function(snapshot) {
			var incident = snapshot.val();
			map.panTo(new L.LatLng(incident.location.lat,incident.location.lng));
			});
		for (var j in myMap.markers){
			var markerID = myMap.markers[j].options.id;
			if (markerID == id){
				myMap.markers[j].openPopup();
			}
		}
	};

	//new incident helper function (gets lat long from map pick and places marker)
	$("#location-picker").on('click touchstart', function(){
		var $modal = $("#addIncidentModal");
		$modal.modal('hide');
		$("#map").css('cursor', 'crosshair');
		map.on('click', function(e){
			new L.marker(e.latlng).addTo(map);
			map.off('click');
			$("#map").css('cursor', 'pointer');
			popLatLng($modal, e.latlng)
		});
	});

};


var GeoLocation = (function(callback) {
	var options = {
		enableHighAccuracy : true,
		timeout : 10000,
		maximumAge : 0
	};
	function getLocation(position) {
		document.cookie = "geoLocation=true";
		GeoLocation.userLocation = {
			lat: position.coords.latitude,
			lng: position.coords.longitude };
		callback(window, document, L, undefined)

	}
	function fallback() {
		$.getJSON('//freegeoip.net/json/', function (data) {
			// sometimes ClientLocation comes back null
			GeoLocation.userLocation = {
				lat: data.latitude,
				lng: data.longitude
			};

		}).fail(function() {
			console.log('geolocation failed resorting to default.');
			GeoLocation.userLocation = {
				lat: 42.877742,
				lng: -97.367445640979
			}
		}).done(function(){
			callback(window, document, L, undefined)
		})
	}

	function error(error) {
		document.cookie = "geoLocation=false";
		console.log(error.message);
		fallback();
	}

	if (navigator && navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(getLocation, error, options);
	} else {
		fallback();
	}

	return {
		//setting default
		userLocation : {
			lat: 42.877742,
			lng: -97.367445640979
		}
	}

})(myMap);




//marker._popup.setContent('something else')




//connect to firebase and add all incidents to myMap.incidents array
(function(){
	var ref = new Firebase("https://firewhat.firebaseio.com/");
	ref.on("child_changed", function(childSnapshot, prevChildKey){
		console.log("child has changed");
		var key = ++prevChildKey;
		var incident = childSnapshot.val();
		myMap.deleteMarker();
		myMap.addMarker(incident, key);
		myMap.listIncident(incident, key);
	});
	ref.on("child_added", function(childSnapshot, prevChildKey){
		var key = ++prevChildKey;
		var incident = childSnapshot.val();
		++myMap.incidentCount;
		myMap.addMarker(incident, key);
		myMap.listIncident(incident, key);
	});
})();


function popLatLng(elem, latLng){
	elem.find("#latitude").val(latLng.lat);
	elem.find("#longitude").val(latLng.lng);
	elem.modal('show');
}

function addNewIncident(obj, id) {
	id = id || false;
	var incidentDetails = new myMap.IncidentDetails(JSON.parse(obj));
	var incidentRef = id ? id : myMap.incidentCount;
	var ref = new Firebase("https://firewhat.firebaseio.com/"+incidentRef);
	if(id !== false) {
		console.log("updating...")
		ref.update(incidentDetails)
		// firebase ref on child_updated should take care of the rest

	} else {
		console.log("creating...")
		ref.set(incidentDetails);
		// firebase ref on child_added should take care of the rest
	}
}

function editIncident(id, marker){
	var $modal = $("#addIncidentModal");
	var ref = new Firebase("https://firewhat.firebaseio.com/"+id);
	ref.once("value", function(snapshot) {
		var incident = snapshot.val();
		$modal.find("#latitude").val(incident.location.lat);
		$modal.find("#longitude").val(incident.location.lng);
		$modal.find("#name").val(incident.name);
		$modal.find("#acres").val(incident.acres);
		$modal.find("#comments").val(incident.comments);
		$modal.find("#hazards").val(incident.hazards);
		$modal.find("#radio").val(incident.radio);
		$modal.find("#resources").val(incident.resources);
		$modal.find("#roc").val(incident.roc);
		$modal.find("#ros").val(incident.ros);
		$modal.find("#structures").val(incident.structures);
	}, function (errorObject) {
		console.log("The read failed: " + errorObject.code);
	});
	$modal.modal('show');
	$(".newIncidentForm").off().submit(function(e){
		e.preventDefault();
		var obj = JSON.stringify($('.newIncidentForm').serializeObject());
		addNewIncident(obj, id);
		$("#addIncidentModal").modal('hide');
		console.log("here");
	});
}

$(".newIncidentForm").submit(function(e){
	e.preventDefault();
	console.log("holy outside")
	var obj = JSON.stringify($('.newIncidentForm').serializeObject());
	addNewIncident(obj);
	$("#addIncidentModal").modal('hide');
});

//helper function to turn form into object of key/val's
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
	$(".newIncidentForm").find("input[type=text], textarea").val("");
});



// modal fills out from firebase ref
// on submit
	// updatefirebase ref
	// update modal._popup.setContent()
	//


// ======
//on submit
	//update firebase ref
	//delete marker
	//add new marker(firebase ref)
	//
