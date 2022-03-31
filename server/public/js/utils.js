///////////////////////////////////////////////////
// Globale Variable und Typen
///////////////////////////////////////////////////

const infoText =
	'This app shows the current position of the <b>ISS</b> (International Space Station). </br>' +
	'Countries are shown on the globe. Two red markers show me important places. (Uni Bremen, Johannesburg SA) </br>' +
	'GEOJSON data is used to display the countries.</br>' +
	'The current position of the ISS is provided by a public API.</br>' +
	'The earth can be rotated in all directions using the arrow keys.</br>' +
	'Where it is light, where it is dark can be faded in and out using a button.</br>' +
	'Another button allows the latitude and longitude lines to be faded in and out.</br>' +
	'The current coordinate of the ISS (longitude/latitude) is displayed in plain text.</br>' +
	'The centre of the earth, as seen by the observer, is displayed as a coordinate (longitude/latitude) in another output field.</br>' +
	'By selecting a country, the time of the next ISS overflight is displayed.';

const indexLon = 0;
const indexLat = 1;

var π = Math.PI,
	radians = π / 180,
	degrees = 180 / π;

// Enum fuer Rotation
const rotateMode = {
	none: 0,
	right: 1,
	left: 2,
	up: 4,
	down: 8,
};

let showGrid = false; // Initial kein Grid
let showNight = true; // Initial Tag/Nacht-Kurve
let showInfo = false; // Initial kein Info Text

// Inititial keine Rotation
let rotateDirection = rotateMode.none;

const api_url = 'https://api.wheretheiss.at/v1/satellites/25544';
console.log('url', window.location.host);
const node_service_api_url = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/satellite`;
///////////////////////////////////////////////////
// Hilfsfunktionen - Anfang
///////////////////////////////////////////////////

function setSatelliteData(pointsOfInterest, name, data) {
	pointsOfInterest.forEach((d) => {
		if (d.name === name) {
			d.coordinates[indexLon] = data.longitude;
			d.coordinates[indexLat] = data.latitude;
		}
	});
}

function getISS(pointsOfInterest) {
	return pointsOfInterest.filter((d) => {
		if (d.name === 'iss') {
			return d;
		}
	});
}

function getPointsOfInterest(pointsOfInterest) {
	return pointsOfInterest.filter((d) => {
		if (d.name !== 'iss') {
			return d;
		}
	});
}

function sticker(sel, label) {
	sel
		.append('rect')
		.attr('rx', 4)
		.attr('ry', 5)
		.attr('width', 100)
		.attr('height', 50)
		.attr('x', -50)
		.attr('y', -15)
		.attr('fill', 'white')
		.attr('stroke', 'orange')
		.classed('frame', true);

	sel
		.append('text')
		.attr('x', 0)
		.attr('y', 0)
		.attr('text-anchor', 'middle')
		.attr('font-family', 'sans-serif')
		.attr('font-size', 14)
		.attr('stroke', 'orange')
		.classed('label', true)
		.text(label ? label : (d) => d.name);

	sel
		.append('text')
		.attr('x', 0)
		.attr('y', 15)
		.attr('text-anchor', 'middle')
		.attr('font-family', 'sans-serif')
		.attr('font-size', 10)
		.attr('stroke', 'orange')
		.classed('label', true)
		.text(label ? label : (d) => `lon: ${d.coordinates[indexLon].toFixed(1)}`);

	sel
		.append('text')
		.attr('x', 0)
		.attr('y', 30)
		.attr('text-anchor', 'middle')
		.attr('font-family', 'sans-serif')
		.attr('font-size', 10)
		.attr('stroke', 'orange')
		.classed('label', true)
		.text(label ? label : (d) => `lat: ${d.coordinates[indexLat].toFixed(1)}`);
}

function stickerPositionISS(sel, label) {
	sel
		.append('rect')
		.attr('rx', 4)
		.attr('ry', 5)
		.attr('width', 100)
		.attr('height', 50)
		.attr('x', -50)
		.attr('y', -15)
		.attr('fill', 'white')
		.attr('stroke', 'orange')
		.classed('frame', true);

	sel
		.append('text')
		.attr('x', 0)
		.attr('y', 0)
		.attr('text-anchor', 'middle')
		.attr('font-family', 'sans-serif')
		.attr('font-size', 14)
		.attr('stroke', 'orange')
		.classed('label', true)
		.text(label ? label : (d) => d.name);

	sel
		.append('text')
		.attr('x', 0)
		.attr('y', 15)
		.attr('text-anchor', 'middle')
		.attr('font-family', 'sans-serif')
		.attr('font-size', 10)
		.attr('stroke', 'orange')
		.classed('label', true)
		.text(label ? label : (d) => `lon: ${d.coordinates[indexLon].toFixed(1)}`);

	sel
		.append('text')
		.attr('x', 0)
		.attr('y', 30)
		.attr('text-anchor', 'middle')
		.attr('font-family', 'sans-serif')
		.attr('font-size', 10)
		.attr('stroke', 'orange')
		.classed('label', true)
		.text(label ? label : (d) => `lat: ${d.coordinates[indexLat].toFixed(1)}`);
}

function stickerNextPass(sel, label) {
	sel
		.append('rect')
		.attr('rx', 4)
		.attr('ry', 5)
		.attr('width', 100)
		.attr('height', 50)
		.attr('x', -50)
		.attr('y', -15)
		.attr('fill', 'white')
		.attr('stroke', 'orange')
		.classed('frame', true);

	sel
		.append('text')
		.attr('x', 0)
		.attr('y', 0)
		.attr('text-anchor', 'middle')
		.attr('font-family', 'sans-serif')
		.attr('font-size', 12)
		.attr('stroke', 'orange')
		.classed('label', true)
		.text(label ? label : (d) => d.name);

	sel
		.append('text')
		.attr('x', 0)
		.attr('y', 15)
		.attr('text-anchor', 'middle')
		.attr('font-family', 'sans-serif')
		.attr('font-size', 10)
		.attr('stroke', 'orange')
		.classed('label', true)
		.text(label ? label : (d) => d.datePass);

	sel
		.append('text')
		.attr('x', 0)
		.attr('y', 30)
		.attr('text-anchor', 'middle')
		.attr('font-family', 'sans-serif')
		.attr('font-size', 10)
		.attr('stroke', 'orange')
		.classed('label', true)
		.text(label ? label : (d) => d.timePass);
}
