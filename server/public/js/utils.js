///////////////////////////////////////////////////
// Globale Variable und Typen
///////////////////////////////////////////////////

const infoText =
  'Diese App zeigt die aktuelle Position der <b>ISS</b> (International Space Station).<br>' +
  'Auf der Erdkugel werden die Länder abgebildet. Zwei rote Marker zeigen mir wichtige Orte.<br>' +
  'Für die Darstellung der Länder werden GEOJSON Daten verwendet.<br>' +
  'Die aktuelle Position der ISS liefert eine öffentliche API.<br>' +
  'Die Erde kann mit den Pfeiltasten in alle Richtungen gedreht werden.<br>' +
  'Wo ist es hell, wo ist es dunkel, lässt sich per Button ein- und ausblenden.<br>' +
  'Ein weiterer Button ermöglicht das ein- ausblenden der Breiten- und Längengerade.<br>' +
  'Die aktuelle Koordinate der <b>ISS</b> (Longitude/Latitude) wird im Klartext angezeigt.<br>' +
  'Der Mittelpunkt der Erde, aus Sicht des Betrachters, wird als Koordinate (Longitude/Latitude) in einem weiteren Ausgabefeld angezeigt.<br>' +
  'Durch die Selektierung eines Landes wird der Zeitpunkt des nächsten Überflugs der ISS angezeigt.';

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
      d.coordinates[1] = data.latitude;
      d.coordinates[0] = data.longitude;
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
    .attr('height', 60)
    .attr('x', -50)
    .attr('y', -15)
    .attr('fill', 'none')
    .attr('stroke', 'orange')
    .classed('frame', true);

  sel
    .append('text')
    .attr('x', 0)
    .attr('y', 5)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 14)
    .attr('stroke', 'orange')
    .classed('label', true)
    .text(label ? label : (d) => d.name);

  sel
    .append('text')
    .attr('x', 0)
    .attr('y', 25)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 14)
    .attr('stroke', 'orange')
    .classed('label', true)
    .text(label ? label : (d) => d.name);
}

function stickerPositionISS(sel, label) {
  sel
    .append('rect')
    .attr('rx', 4)
    .attr('ry', 5)
    .attr('width', 100)
    .attr('height', 60)
    .attr('x', -50)
    .attr('y', -15)
    .attr('fill', 'none')
    .attr('stroke', 'orange')
    .classed('frame', true);

  sel
    .append('text')
    .attr('x', 0)
    .attr('y', 5)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 14)
    .attr('stroke', 'orange')
    .classed('label', true)
    .text(label ? label : (d) => d.name);

  sel
    .append('text')
    .attr('x', 0)
    .attr('y', 25)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 14)
    .attr('stroke', 'orange')
    .classed('label', true)
    .text(label ? label : (d) => d.name);
}

/* let controller = new AbortController();

d3.selectAll('p')
  .on('mouseenter', async function () {
    console.log('mouseenter');
    try {
      // initiate fetch with an AbortController signal
      const response = await fetch('https://swapi.dev/api/planets/1/', {
        signal: controller.signal,
      });
      console.log({ response });
      const planet = await response.json();
      console.log({ planet });
      d3.select(this).attr('title', planet.name);
    } catch (error) {
      console.log({ error });
      // do nothing
    }
  })
  .on('mouseleave', function () {
    console.log('mouseleave');
    // remove title attribute
    d3.select(this).attr('title', null);
    // invoke abort signal
    controller.abort();
    // reset AbortController
    controller = new AbortController();
  }); */

/* function onMouseDown(e, datum) {
    const [centerX, centerY] = pathGenerator.centroid(datum);
    const earthCoordinates = projection.invert(d3.pointer(e));

    // local service
    const url = `http://localhost:8080/satellite/iss-passes/?lat=${earthCoordinates[0]}&lon=${earthCoordinates[1]}&alt=1650&n=1`;
    // foreign service
    //const url = `http://api.open-notify.org/iss/v1/?lat=${earthCoordinates[0]}&lon=${earthCoordinates[1]}&alt=1650&n=1`;

    fetch(url, { method: 'GET' })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Bad status code from server.');
        }
        return response.json();
      })
      .then((data) => {
        if (data.message === 'success') {
          var date = new Date(data.response[1].risetime * 1000);
          console.log(data.response[0].risetime);
          console.log(date.getTime());
          console.log(date);
          console.log(date.getDate());
          nextPass = data.response[0].risetime;
        }

        var tag = date.getDate();
        var monat = date.getMonth() + 1;
        var jahr = date.getFullYear();
        var stunde = date.getHours();
        var minute = date.getMinutes();
        var sekunde = date.getSeconds();
        var millisek = date.getMilliseconds();

        var uhrzeit = `${tag}.${monat}.${jahr} ${stunde}:${minute}`;
        const infoText = `${datum.properties.NAME}: ${uhrzeit}`;

       
        countryData.push(infoText);
        const hoveredRectangle = group
          .selectAll('.next-pass')
          .data(countryData)
          .join('text')
          .attr('class', 'next-pass')
          .attr('font-size', '25px')
          .attr('x', centerX)
          .attr('y', centerY)
          .attr('stroke', 'orange')
          .text((d) => d);

        const t = d3.timer(() => {
          countryData.pop();
          group
            .selectAll('.next-pass')
            .data(countryData)
            .join('text')
            .attr('class', 'next-pass')
            .attr('x', centerX)
            .attr('y', centerY)
            .attr('stroke', 'orange')
            .text((d) => d);
          t.stop();
        }, 5000);
      });
  } */
