const { Marvelmind } = require('./marvelmind');

const marvelmind = new Marvelmind({ debug: false, paused: true });
marvelmind.toggleReading();

// marvelmind.on('rawDistances', (hedgehogAddress, beaconsDistances) => {
//   console.log(hedgehogAddress, beaconsDistances);
// });
marvelmind.on('hedgehogMilimeter', (hedgehogAddress, hedgehogCoordinates) => {
  console.log(hedgehogAddress, hedgehogCoordinates);
});
// marvelmind.on('beaconsMilimeter', (beaconsCoordinates) => {
//   console.log(beaconsCoordinates);
// });
// marvelmind.on('quality', (hedgehogAddress, qualityData) => {
//   console.log(hedgehogAddress, qualityData);
// });
// marvelmind.on('telemetry', (deviceAddress, telemetryData) => {
//   console.log(deviceAddress, telemetryData);
// });
