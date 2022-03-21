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
		drawISS('.iss', hasPath);
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
					`ISS-lon/lat: ${d.coordinates[1].toFixed(
						1
					)}/${d.coordinates[0].toFixed(1)}`
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

		/* iss
      .on('mouseenter', console.log('SHOW'))
      .on('mouseleave touchend', console.log('HIDE')); */

		//console.log('VVV', getISS(pointsOfInterest));
		/*  group
      .selectAll('.iss-sticker')
      .data(getISS(pointsOfInterest))
      .join(
        (enter) => {
          enter
            .append('g')
            .attr('transform', `translate(75, 150)`)
            .attr(
              'transform',
              (d, i) =>
                'translate(' +
                getMapping('lon', d) +
                ',' +
                getMapping('lat', d) +
                ')'
            )
            .style('display', (d, i) => (hasPath[2] ? 'inline' : 'none'))
            .call(stickerPositionISS);
        },
        (exit) => {
          exit.remove();
        }
      ); */

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
	}

	///////////////////////////////////////////////////
	// Funktion fuer die Darstellung weiterer
	// interessanter Punkte (hier beispielhaft
	// die Universität Bremen
	// und die Stadt Johannesburg in Südafrika)
	///////////////////////////////////////////////////
	function drawPointsOfInterest(className, hasPath) {
		// Die Punkte zeichnen zeichen als Kreis (rot)
		// auf der Erdkugel anzeigen.

		console.log('pointsOfInterest', pointsOfInterest);
		group
			.selectAll(className)
			.data(getPointsOfInterest(pointsOfInterest))
			.join('circle')
			.attr('class', 'point')
			.attr('cx', (d) => getMapping('lon', d))
			.attr('cy', (d) => getMapping('lat', d))
			.attr('r', 8)
			.style('display', (d, i) => (hasPath[i] ? 'inline' : 'none'))
			.attr('fill', 'red');

		group
			.selectAll('g')
			.data(getPointsOfInterest(pointsOfInterest))
			.join('g')
			.attr('transform', `translate(75, 150)`)
			.attr(
				'transform',
				(d, i) =>
					'translate(' + getMapping('lon', d) + ',' + getMapping('lat', d) + ')'
			)
			.style('display', (d, i) => (hasPath[i] ? 'inline' : 'none'))
			.call(stickerPositionISS);
	}

	/////////////////////////////////////////////////////////////////////////////////////
	// Handler fuer die Selektion eines Landes,
	// um den nächsten Ueberflug der ISS anzuzeigen
	/////////////////////////////////////////////////////////////////////////////////////
	async function setCountryData(event, datum) {
		try {
			const [centerX, centerY] = pathGenerator.centroid(datum);
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
			var tag = date.getDate();
			var monat = date.getMonth() + 1;
			var jahr = date.getFullYear();
			var stunde = date.getHours();
			var minute = date.getMinutes();
			var uhrzeit = `${tag}.${monat}.${jahr} ${stunde}:${minute}`;

			// Den Namen des selektierten Landes und das Datum zu
			// einem String formatieren
			const infoText = `${datum.properties.NAME}: ${uhrzeit}`;

			// Das Datum in ein Array pushen
			// zur Zeit nur ein Land
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
		} catch (error) {
			console.log({ error });
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

	function getPOIsVisibleState() {
		// Pruefen, ob ein Punkt sichtbar ist oder ob er sich auf der Rückseite
		// der Erdkugel befindet
		const hasPath = [false, false, false];
		pointsOfInterest.forEach(function (d, i) {
			lon_lat = [d.coordinates[0], d.coordinates[1]];
			hasPath[i] =
				path({
					type: 'Point',
					coordinates: lon_lat,
				}) != undefined;
		});
		return hasPath;
	}

	function getLatitude(angle) {
		// Latitude abhängig vom Drehwinkel bestimmen
		// Wenn der Winkel zwischen 0..180 Grad liegt
		// dann ist die Latitude 0 .. -180
		// sonst ist die Latitude 360 - angle
		return angle >= 0 && angle <= 180 ? -angle : 360 - angle;
		/* return angle; */
	}

	function getAngleOfLatitude(lat) {
		if (lat <= 0 && lat >= -180) {
			return -lat;
		} else {
			return 360 - lat;
		}
	}

	function getLongitude(angle) {
		// Longitude abhängig vom Drehwinkel bestimmen
		// Wenn der Winkel zwischen 0..90 Grad liegt
		// dann ist die Longitude 0 .. -90
		/* 	if (angle >= 0 && angle <= 90) {
			return -angle;
		} else if (angle > 90 && angle <= 180) {
			return angle - 180;
		} else if (angle >= 180 && angle <= 270) {
			return angle - 180;
		} else {
			return 360 - angle;
		} */
		return angle;
	}

	function getAngleOfLongitude(lon) {
		return lon;
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
			console.log('d', d);

			const angleLat = getAngleOfLatitude(d[0].coordinates[0]);
			const angleLon = getAngleOfLongitude(d[0].coordinates[1]);

			console.log('angleLon', angleLon);
			console.log('angleLat', angleLat);
			//positionActual = [angleLat, angleLon];
			positionActual = [angleLat, angleLon];
			refreshEarth(positionActual);
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
				let newRotation = positionActual[1];
				if (positionActual[1] >= 360) {
					newRotation = positionActual[1] - 360;
				}
				positionActual[1] = newRotation + 1;
			} else if (rotateDirection === rotateMode.left) {
				let newRotation = positionActual[1];
				if (positionActual[1] <= 0) {
					newRotation = positionActual[1] + 360;
				}
				positionActual[1] = newRotation - 1;
			} else if (rotateDirection === rotateMode.down) {
				let newRotation = positionActual[0];
				if (positionActual[0] > -90) {
					positionActual[0] = newRotation - 1;
				}
			} else if (rotateDirection === rotateMode.up) {
				let newRotation = positionActual[0];
				if (positionActual[0] < 90) {
					positionActual[0] = newRotation + 1;
				}
			}

			refreshEarth(positionActual);
			/* projection.rotate(positionActual);

			group.select('.earth').attr('d', pathGenerator(sphere));
			group.select('.graticule').attr('d', pathGenerator(graticuleJson));
			group.selectAll('.country').attr('d', pathGenerator);
			group.select('.night').attr('d', pathGenerator);

			const hasPath = getPOIsVisibleState();
			drawPointsOfInterest('.point', hasPath);
			drawISS('.iss', hasPath);
			console.log(positionActual[0]);
			const latitude = getLatitude(positionActual[0]);
			console.log(getAngleOfLatitude(latitude));
			console.log(positionActual[1]);
			const longitude = getLongitude(positionActual[1]);
			d3.select('#origin')
				.data(positionActual)
				.text(`Origin lon/lat: ${longitude.toFixed(1)}/${latitude.toFixed(1)}`); */
		}
	}

	function refreshEarth(posAct) {
		projection.rotate(posAct);

		group.select('.earth').attr('d', pathGenerator(sphere));
		group.select('.graticule').attr('d', pathGenerator(graticuleJson));
		group.selectAll('.country').attr('d', pathGenerator);
		group.select('.night').attr('d', pathGenerator);

		const hasPath = getPOIsVisibleState();
		drawPointsOfInterest('.point', hasPath);
		drawISS('.iss', hasPath);
		const latitude = getLatitude(posAct[0]);
		const longitude = getLongitude(posAct[1]);
		d3.select('#origin')
			.data(posAct)
			.text(`Origin lon/lat: ${longitude.toFixed(1)}/${latitude.toFixed(1)}`);
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

	// Einplannung der Handlern für die Selektion
	// von Ländern
	const countryData = [];
	let abortController = new AbortController();
	countries
		?.on('mouseenter', setCountryData)
		.on('mouseleave touchend', resetCountryData);

	/////////////////////////////////////////////////
	/// Für die Zeichnung der Länder
	////////////////////////////////////////////////

	// Initiale einmalige Darstellung der Interressanten Punkte
	const hasPath = getPOIsVisibleState();
	drawPointsOfInterest('.point', hasPath);

	// Timer für die Rotation (rotate Funktion)
	let tickerRotate = d3.interval(async function (elapsed) {
		await rotate();
	}, rotateTickDuration);

	// Einmalige Initialisierung der ISS-Position
	// Danach Aktualisierung durch Timer
	await updateISS();
	// Timer für die ISS Aktualisierung (updateISS Funktion)
	let tickerISS = d3.interval(async function (elapsed) {
		await updateISS();
	}, issTickDuration);

	showAndRefreshNight(group, pathGenerator);
}

// Die Funktion aufrufen
drawApp();
