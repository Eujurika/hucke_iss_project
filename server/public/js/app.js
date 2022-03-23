async function drawApp() {
  /*
  Die Funktion drawApp ist für die Dynamik,
  der Website.
  Die Funtion liest alle benötigten Daten
  aus den externen Ressourcen.
  Sie handelt die behandelt die Benutzereingaben.
  Hierfür sind die benötigzen Händler implementier.
  Ausserdem werden Timer gestartet, um die Darstellung
  ind er der dynamisch zu aktualisieren.
  */

  // Variable für Positionierung und Skalierung
  const scale = 250; // Fester Skalierungsfaktor
  const cx = 400;
  const cy = 225;
  let positionActual = [0, 0];

  // ISS - Position aktualisieren (alle 3000ms)
  const issTickDuration = 5000; // Aktualisierung ISS
  const rotateTickDuration = 100; // Aktualisierung wenn Erde rotieren soll

  // alle Länder als geojson objects lesen
  const data = await d3.json('./data/world-geojson.json');

  // alle darzustellenden interessanten Punkte
  const pointsOfInterest = await d3.json('./data/points-of-interest.json');

  ///////////////////////////////////////////////////
  // Funktionen fuer die Darstellung der ISS
  ///////////////////////////////////////////////////

  async function updateISS() {
    // Aktualisieren der ISS Koordinaten und Darstellung der ISS
    const issData = await d3.json(`${node_service_api_url}/iss-position`);
    const { latitude, longitude } = issData;
    setSatelliteData(pointsOfInterest, 'iss', issData);
    const hasPath = getPOIsVisibleState();
    const iss = drawISS('.iss', hasPath);

    return iss;
  }

  function animate(circle) {
    // Den Kreis der ISS blinkend von Farbe gelb Radius 5
    // zu Farbe orange Radius 8 animieren
    circle
      .transition()
      .duration(800)
      .attr('fill', 'yellow')
      .attr('r', 5)
      .transition()
      .duration(800)
      .attr('fill', 'orange')
      .attr('r', 8)
      .on('end', () => circle.call(animate));
  }

  function drawISS(className, hasPath) {
    // Die ISS zeichnen

    // Die Position (Longitude und Latitude) im
    // Textfeld mit der Id iss-lon-lat ausgeben.
    const issLonLat = d3
      .select('#iss-lon-lat')
      .data(getISS(pointsOfInterest))
      .text(
        (d) =>
          `ISS-lon/lat: ${d.coordinates[indexLon].toFixed(1)}/${d.coordinates[
            indexLat
          ].toFixed(1)}`
      );

    // Die ISS zeichen als Kreis animiert (orange/gelb blinkend)
    // auf der Erdkugel anzeigen.
    const iss = group
      .selectAll(className)
      .data(getISS(pointsOfInterest))

      // Ein oranger-gelber Kreis für die ISS
      .join('circle')
      .attr('class', 'iss')
      .attr('cx', (d) => getMapping('lon', d))
      .attr('cy', (d) => getMapping('lat', d))
      .attr('r', 10)
      .style('display', (d, i) => (hasPath[2] ? 'inline' : 'none'))
      .attr('fill', 'orange')
      .call(animate);

    // Eine Grafik fuer die ISS.
    // Wurde verworfen, da sehr schlecht sichtbar.
    /* .join('svg:image')
      .attr('class', 'iss')
      .attr('xlink:href', './assets/images/space-station.png')
      .attr('x', (d) => getMapping('lon', d) - 15)
      .attr('y', (d) => getMapping('lat', d) - 15)
      .attr('height', 30)
      .attr('width', 30)
      .style('display', (d, i) => (hasPath[2] ? 'inline' : 'none')); */
    return iss;
  }

  ///////////////////////////////////////////////////
  // Funktion fuer die Darstellung weiterer
  // interessanter Punkte (hier beispielhaft
  // die Universität Bremen
  // und die Stadt Johannesburg in Südafrika)
  ///////////////////////////////////////////////////
  function drawPointsOfInterest(className, hasPath) {
    // Die Punkte zeichnen zeichen als Kreis (rot) auf der Erdkugel anzeigen.
    const points = group
      .selectAll(className)
      .data(getPointsOfInterest(pointsOfInterest))
      .join('circle')
      .attr('class', 'point')
      .attr('cx', (d) => getMapping('lon', d))
      .attr('cy', (d) => getMapping('lat', d))
      .attr('r', 8)
      .style('display', (d, i) => (hasPath[i] ? 'inline' : 'none'))
      .attr('fill', 'red');

    return points;
  }

  /////////////////////////////////////////////////////////////////////////////////////
  // Handler fuer die Selektion eines Landes,
  // um den nächsten Ueberflug der ISS anzuzeigen
  /////////////////////////////////////////////////////////////////////////////////////
  async function setCountryData(event, datum) {
    console.log('datum', datum);
    try {
      const [centerX, centerY] = pathGenerator.centroid(datum);
      console.log('centerX', centerX);
      const earthCoordinates = projection.invert(d3.pointer(event));
      const url = `${node_service_api_url}/iss-passes?lat=${earthCoordinates[0]}&lon=${earthCoordinates[1]}&alt=1650&n=1`;
      event.preventDefault();
      // initiate fetch with an AbortController signal
      const response = await fetch(url, {
        signal: abortController.signal,
      });
      /*  if (!response.ok) {
        throw new Error('Bad status code from server.');
      } */
      const data = await response.json();

      // Das von der API gelieferte Datum in ein
      // lesbares Format wandeln
      var date = new Date(data.response[1].risetime * 1000);

      // Objekt mit Name, Datum und Uhrzeit
      const datumToShow = {
        name: datum.properties.NAME,
        datePass: `${date.getDate()}.${
          date.getMonth() + 1
        }.${date.getFullYear()}`,
        timePass: `${date.getHours()}:${date.getMinutes()}`,
      };

      // Das Datum in ein Array pushen
      // zur Zeit nur ein Land
      countryData.push(datumToShow);

      const hoveredRectangle = group
        .selectAll('g')
        .data(countryData)
        .join('g')
        .attr('class', 'next-pass')
        .attr('font-size', '25px')
        .attr(
          'transform',
          (d, i) => 'translate(' + centerX + ',' + (centerY - 55) + ')'
        )
        .attr('stroke', 'orange')
        .call(stickerNextPass);
    } catch (error) {
      // do nothing
    }
  }

  async function resetCountryData() {
    // Die Daten aus dem Array entfernen
    countryData.pop();
    group
      .selectAll('.next-pass')
      .data(countryData)
      .join((exit) => exit.remove());
    // invoke abort signal
    abortController.abort();
    // reset AbortController
    abortController = new AbortController();
  }

  /////////////////////////////////////////////////////////////////////////////////////
  // Handler fuer die Selektion eines Points,
  /////////////////////////////////////////////////////////////////////////////////////
  async function setPointData(event, datum) {
    try {
      const eventData = d3.pointer(event);
      const myX = eventData[0];
      const myY = eventData[1];
      event.preventDefault();

      // Das Datum in ein Array pushen immer nur ein Land
      pointData.push(datum);
      const hoveredRectangle = group
        .selectAll('g')
        .data(pointData)
        .join('g')
        .attr('class', 'poi-circle')
        .attr('font-size', '25px')
        .attr(
          'transform',
          (d, i) => 'translate(' + myX + ',' + (myY - 55) + ')'
        )
        .attr('stroke', 'orange')
        /* .text((d) => d.name); */
        .call(sticker);
    } catch (error) {
      // do nothing
    }
  }

  async function resetPointData() {
    // Die Daten aus dem Array entfernen
    pointData.pop();
    group
      .selectAll('.poi-circle')
      .data(pointData)
      .join((exit) => exit.remove());
  }

  /////////////////////////////////////////////////////////////////////////////////////
  // Handler fuer die Selektion der ISS
  /////////////////////////////////////////////////////////////////////////////////////
  async function setIssData(event, datum) {
    try {
      const eventData = d3.pointer(event);
      const myX = eventData[0];
      const myY = eventData[1];
      event.preventDefault();
      console.log('SetISSData');
      // Das Datum in ein Array pushen
      issData.push(datum);
      const hoveredRectangle = group
        .selectAll('.g')
        .data(issData)
        .join('g')
        .attr('class', 'iss-circle')
        .attr('font-size', '25px')
        .attr(
          'transform',
          (d, i) => 'translate(' + myX + ',' + (myY - 55) + ')'
        )
        .attr('stroke', 'orange')
        /* .text((d) => d); */
        .call(stickerPositionISS);
    } catch (error) {
      // do nothing
    }
  }

  async function resetIssData() {
    // Die Daten aus dem Array entfernen
    issData.pop();
    group
      .selectAll('.iss-circle')
      .data(issData)
      .join((exit) => exit.remove());
  }

  function getPOIsVisibleState() {
    // Pruefen, ob ein Punkt sichtbar ist oder ob er sich auf der Rückseite
    // der Erdkugel befindet
    const hasPath = [false, false, false];
    pointsOfInterest.forEach(function (d, i) {
      lon_lat = [d.coordinates[indexLon], d.coordinates[indexLat]];
      hasPath[i] =
        path({
          type: 'Point',
          coordinates: lon_lat,
        }) != undefined;
    });
    return hasPath;
  }

  ///////////////////////////////////////////////////
  // Ereignishandler für die Buttons zum rotieren
  ///////////////////////////////////////////////////

  const buttonRotateRight = d3
    .select('#button-rotate-right')
    .on('mousedown touchstart', function (event) {
      event.preventDefault();
      d3.select(this).style('color', 'orange');
      rotateDirection = rotateMode.right;
    })
    .on('mouseup mouseleave touchend', function () {
      d3.select(this).style('color', 'gray');
      rotateDirection = rotateMode.none;
    });

  const buttonRotateLeft = d3
    .select('#button-rotate-left')
    .on('mousedown', function (event) {
      d3.select(this).style('color', 'orange');
      rotateDirection = rotateMode.left;
    })
    .on('touchstart', function (event) {
      event.preventDefault();
      d3.select(this).style('color', 'orange');
      rotateDirection = rotateMode.left;
    })
    .on('mouseup mouseleave touchend', function () {
      d3.select(this).style('color', 'gray');
      rotateDirection = rotateMode.none;
    });

  const buttonRotateDown = d3
    .select('#button-rotate-down')
    .on('mousedown touchstart', function (event) {
      event.preventDefault();
      d3.select(this).style('color', 'orange');
      rotateDirection = rotateMode.down;
    })
    .on('mouseup mouseleave touchend', function () {
      d3.select(this).style('color', 'gray');
      rotateDirection = rotateMode.none;
    });

  const buttonRotateUp = d3
    .select('#button-rotate-up')
    .on('mousedown touchstart', function (event) {
      event.preventDefault();
      d3.select(this).style('color', 'orange');
      rotateDirection = rotateMode.up;
    })
    .on('mouseup mouseleave touchend', function () {
      d3.select(this).style('color', 'gray');
      rotateDirection = rotateMode.none;
    });

  // Optionale Dartstellung eines Grids Laengen und Breitengrade
  const buttonGrid = d3
    .select('#button-grid')
    .style('color', showGrid ? 'orange' : 'gray')
    .on('mousedown touchstart', function (event) {
      event.preventDefault();
      showGrid = !showGrid;
      d3.select(this).style('color', showGrid ? 'orange' : 'gray');
      graticule.attr('stroke-opacity', `${showGrid ? '0.7' : '0.0'}`);
    })
    .on('mouseup touchend', function () {});

  // Optionale Darstellung der Tag/Nacht Kurve
  const buttonNight = d3
    .select('#button-night')
    .style('color', showNight ? 'orange' : 'gray')
    .on('mousedown touchstart', function (event) {
      event.preventDefault();
      showNight = !showNight;
      d3.select(this).style('color', showNight ? 'orange' : 'gray');
      if (showNight) {
        showAndRefreshNight(group, pathGenerator);
      } else {
        hideNight(group);
      }
    })
    .on('mouseup touchend', function () {});

  // Optionale Dartstellung Info Text
  const buttonInfo = d3
    .select('#button-info')
    .style('color', showInfo ? 'orange' : 'gray')
    .on('mousedown touchstart', function (event) {
      event.preventDefault();
      showInfo = !showInfo;
      d3.select(this).style('color', showInfo ? 'orange' : 'gray');
      d3.select('#info')
        .style('display', showInfo ? 'block' : 'none')
        /* d3.select('#info')
        .style('color', showInfo ? 'white' : 'gray') */
        .html(infoText);
    })
    .on('mouseup touchend', function () {});

  // Optionale Dartstellung Info Text
  const buttonShowIss = d3
    .select('#button-show-iss')
    /* .style('color', showInfo ? 'orange' : 'gray') */
    .on('mousedown touchstart', function (event) {
      event.preventDefault();
      d3.select(this).style('color', 'orange');

      const d = getISS(pointsOfInterest);
      //console.log('d', d);

      /*  const angleLon = getAngleOfLongitude(d[0].coordinates[indexLon]);
      const angleLat = getAngleOfLatitude(d[0].coordinates[indexLat]);

      console.log('angleLon', angleLon);
      console.log('angleLat', angleLat); */
      //positionActual = [angleLat, angleLon];
      /* positionActual = [angleLon, angleLat]; */
      /* refreshEarth(positionActual); */
      refreshEarth(d[0].coordinates);
      /* console.log('WO IST DIE ISS?'); */
      ///
      ///
      ///
      ///
      ///
    })
    .on('mouseup mouseleave touchend', function () {
      d3.select(this).style('color', 'gray');
    });

  async function rotate() {
    // Rotation der Erde durchfuehren
    if (rotateDirection !== rotateMode.none) {
      // Wenn eine Rotation selektiert wurde

      if (rotateDirection === rotateMode.right) {
        let angle = positionActual[indexLon];
        if (positionActual[indexLon] < 180) {
          positionActual[indexLon] = angle + 1;
        }
      } else if (rotateDirection === rotateMode.left) {
        let angle = positionActual[indexLon];
        if (positionActual[indexLon] > -180) {
          positionActual[indexLon] = angle - 1;
        }
      } else if (rotateDirection === rotateMode.down) {
        let newRotation = positionActual[indexLat];
        if (positionActual[indexLat] > -90) {
          positionActual[indexLat] = newRotation - 1;
        }
      } else if (rotateDirection === rotateMode.up) {
        let newRotation = positionActual[indexLat];
        if (positionActual[indexLat] < 90) {
          positionActual[indexLat] = newRotation + 1;
        }
      }
      refreshEarth(positionActual);
    }
  }

  function refreshEarth(posAct) {
    const p = [-posAct[0], -posAct[1]];
    projection.rotate(p);

    group.select('.earth').attr('d', pathGenerator(sphere));
    group.select('.graticule').attr('d', pathGenerator(graticuleJson));
    group.selectAll('.country').attr('d', pathGenerator);
    group.select('.night').attr('d', pathGenerator);

    const hasPath = getPOIsVisibleState();
    drawPointsOfInterest('.point', hasPath);
    drawISS('.iss', hasPath);
    d3.select('#origin')
      .data(posAct)
      .text(
        `Origin lon/lat: ${posAct[indexLon].toFixed(1)}/${posAct[
          indexLat
        ].toFixed(1)}`
      );
  }

  function getMapping(coordName, d) {
    // Ermittelt die Abbildung von Lon, Lat
    const [x, y, z] = projection(d.coordinates);
    if (coordName === 'lon') {
      return x;
    } else if (coordName === 'lat') {
      return y;
    }
    return z;
  }

  ///////////////////////////////////////////////////
  // Die Projektion der Erde als Kugel
  // HIER BEGINNEN DIE ANWEISUNGEN DER FUNKTION drawApp
  ///////////////////////////////////////////////////

  const projection = d3
    .geoOrthographic()
    .scale(scale)
    .translate([cx, cy])
    .rotate(positionActual); // Erde als Kugel

  const path = d3.geoPath().projection(projection);
  /* .pointRadius(function (d) {
      return 6;
    }); */

  // Den Container für die svg Grafik selektieren
  const wrapper = d3.select('#wrapper');

  // Einen svg - tag hinzufuegen
  const svgContainer = wrapper.append('svg').attr('viewBox', '0 0 800 450');

  // Eine Gruppe g-tag für die Zusammenfassung aller
  // darzustellenden Elemente in dem svgContainer
  // hinzufügen
  const group = svgContainer.append('g');

  // Den Pfadgenerator erstellen
  const pathGenerator = d3.geoPath().projection(projection);

  // Die Erde zeichnen
  const sphere = { type: 'Sphere' };
  const earth = group
    .append('path')
    .attr('class', 'earth')
    .attr('d', pathGenerator(sphere));

  // Das Grid erzeugen
  const graticuleJson = d3.geoGraticule10();

  // Das grid darstellen
  // Opacity wird abhaengig #grid-input 0 (nicht sichtbar) bzw. 0.7 (sichtbar)
  const graticule = group
    .append('path')
    .attr('class', 'graticule')
    .attr('d', pathGenerator(graticuleJson))
    .attr('stroke-opacity', `${showGrid ? '0.7' : '0.0'}`);

  /////////////////////////////////////////////////
  /// Für die Zeichnung der Länder
  ////////////////////////////////////////////////

  // Die Pfade für die Länder zeichnen
  const countries = group
    .selectAll('.country')
    .data(data.features)
    .join('path')
    .attr('class', 'country')
    .attr('d', (feature) => pathGenerator(feature));

  ////////////////////////////////////////////////////////////////////////
  // Einplannung der Handlern für die Selektion der Laender von Ländern
  const countryData = [];
  let abortController = new AbortController();
  countries
    ?.on('mouseenter', setCountryData)
    .on('mouseleave touchend', resetCountryData);
  ////////////////////////////////////////////////////////////////////////

  /////////////////////////////////////////////////
  /// Für die Zeichnung der Länder
  ////////////////////////////////////////////////

  // Initiale einmalige Darstellung der Interressanten Punkte
  const hasPath = getPOIsVisibleState();

  const points = drawPointsOfInterest('.point', hasPath);

  ////////////////////////////////////////////////////////////////////////
  // Einplannung der Handlern für die Selektion von Points of Interrest
  const pointData = [];
  points
    .on('mouseenter', setPointData)
    .on('mouseleave touchend', resetPointData);
  ////////////////////////////////////////////////////////////////////////

  // Timer für die Rotation (rotate Funktion)
  let tickerRotate = d3.interval(async function (elapsed) {
    await rotate();
  }, rotateTickDuration);

  // Einmalige Initialisierung der ISS-Position
  // Danach Aktualisierung durch Timer
  const iss = await updateISS();

  ////////////////////////////////////////////////////////////////////////
  // Einplannung der Handlern für die Selektion von Points of Interrest
  const issData = [];
  iss.on('mouseenter', setIssData).on('mouseleave touchend', resetIssData);
  ////////////////////////////////////////////////////////////////////////

  // Timer für die ISS Aktualisierung (updateISS Funktion)
  let tickerISS = d3.interval(async function (elapsed) {
    await updateISS();
  }, issTickDuration);

  showAndRefreshNight(group, pathGenerator);
}

// Die Funktion aufrufen
drawApp();
