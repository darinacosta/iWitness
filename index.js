var http = require("http"),
    fs = require('fs'),
    gju = require('geojson-utils'),
    parseString = require('xml2js').parseString,
    url = "http://map.labucketbrigade.org/feed",
    file = "incidents.json",
    incidents = require('./incidents.json'),
    parishes = require('./assets/layers/parishesMerged.json'),

pointInPoly = function(point){
  var result = gju.pointInPolygon({"type":"Point","coordinates":point}, parishes)
  return result;
},

download = function(url, callback) {
  http.get(url, function(res) {
    var data = "";
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on("end", function() {
      callback(data);
    });
  }).on("error", function() {
    callback(null);
  });
},

writeToFile = function(content){
  fs.writeFile(file, content, function(e){
    if(e) {
      console.log(e);
    } else {
        console.log("The file was saved.");
    }
  })
},

jsonRecorded = function(entry){
  for (var i = 0; i < incidents.length; i++){
    if (incidents[i]['guid'][0] === entry['guid'][0]){
      console.log(incidents[i]['guid']  + ' is already recorded')
      return true;
    }
  }
  return false;
},

updateIncidents = function(targetData){
  for (var i = 0; i < targetData.length; i++){
    if (jsonRecorded(targetData[i]) === false){
      targetData[i]['georss:point'] = parseLatLong(targetData[i]['georss:point'][0]);
      if (pointInPoly(targetData[i]['georss:point']) === true){
        incidents.push(targetData[i]);
        console.log(targetData[i]['guid'] + ' was recorded');
      }
    }
  };
  return JSON.stringify(incidents, undefined, 2);
},

parseLatLong = function(latLngStrng){
  splitLatLng = latLngStrng.split(' ');
  lat = parseFloat(splitLatLng[0]);
  lng = parseFloat(splitLatLng[1]);
  splitLatLng[0] = lng;
  splitLatLng[1] = lat;
  console.log(splitLatLng);
  return splitLatLng;
};

download(url, function(data) {
  //var json;
  if (data) {
    parseString(data, function (err, result) {
      var targetData = result['rss']['channel'][0]['item'],
          incidentString = updateIncidents(targetData);
      writeToFile(incidentString);
    });
  }
  else console.log("error");  
});
