import fetch from 'node-fetch';

// Beispiel URL
// 'http://api.open-notify.org/iss/v1/?lat=70.55&lon=95.1'

export async function getIssPasses(options) {
  const api_url = `http://api.open-notify.org/iss/v1/?lat=${options.lon}&lon=${options.lat}`;

  const response = await fetch(api_url);
  try {
    const data = await response.json();
    //console.log('data', data);
    return data;
  } catch (err) {
    //console.error(err);
    return err;
  }
}

export async function getIssPosition() {
  const api_url = 'https://api.wheretheiss.at/v1/satellites/25544';
  const api_url_01 = 'http://api.open-notify.org/iss-now.json';

  const response = await fetch(api_url);
  try {
    const data = await response.json();
    //console.log('data', data);
    return data;
  } catch (err) {
    //console.log(err);
    return err;
  }
}
