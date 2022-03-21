import { getIssPosition, getIssPasses } from './model.js';

export async function issPositionAction(request, response) {
  const data = await getIssPosition();
  response.send(data);
}

export async function issPassesAction(request, response) {
  //console.log('REQUEST', request.query);
  const options = {
    lat: request.query.lat,
    lon: request.query.lon,
  };
  //console.log(request);
  //console.log(options);
  const data = await getIssPasses(options);
  response.send(data);
}
