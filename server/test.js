const { Marvelmind } = require('./marvelmind');

const marvelmind = new Marvelmind({ debug: false, paused: true });
marvelmind.toggleReading();

// marvelmind.on('rawDistances', (hedgehogAddress, beaconsDistances) => {
//   console.log('rawDistances', hedgehogAddress, beaconsDistances);
// });
marvelmind.on('hedgehogMilimeter', (hedgehogAddress, hedgehogCoordinates) => {
  console.log('hedgehogMilimeter', hedgehogAddress, hedgehogCoordinates);
});
// marvelmind.on('beaconsMilimeter', (beaconsCoordinates) => {
//   console.log('beaconsMilimeter', beaconsCoordinates);
// });
// marvelmind.on('quality', (hedgehogAddress, qualityData) => {
//   console.log('quality', hedgehogAddress, qualityData);
// });
// marvelmind.on('telemetry', (deviceAddress, telemetryData) => {
//   console.log('telemetry', deviceAddress, telemetryData);
// });
