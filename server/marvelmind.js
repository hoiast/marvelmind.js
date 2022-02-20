const { SerialPort } = require('serialport');
const { DelimiterParser } = require('@serialport/parser-delimiter');
const bufferpack = require('bufferpack');
const EventEmitter = require('events');

class Marvelmind extends EventEmitter {
  constructor({
    portAddress = 'COM3',
    baudRate = 9600,
    debug = false,
    paused = false,
  } = {}) {
    super();

    // . Initialize User Configuration
    this.portAddress = portAddress;
    this.baudRate = baudRate;
    this.debug = debug;
    this.paused = paused;

    // . Init properties
    this.serialPort = null;
    this.parser = null;
    this.data = {
      hedgehogMilimeter: { name: 'Hedgehog Coordinates (mm)', data: {} }, //hedgehogAddress: { x: int, y: int, z: int}
      beaconsMilimeter: { name: 'Beacons Coordinates (mm)', data: {} }, //deviceAddress: { x: int, y: int, z: int}
      rawDistances: { name: 'Beacon Distances (mm)', data: {} }, // hedgehogAddress: { beacondAddress: {distance: int}
      quality: { name: 'Quality Parameter (%)', data: {} }, //hedgehogAddress: {quality: int, geofencingZoneIndex: int}
      telemetry: { name: 'Battery (mV) and RSSI (Dbm)', data: {} }, //deviceAddress: { battery: int, RSSI: int}
    };

    // . Initialize Data Processing
    this.init();
  }

  toggleReading() {
    this.paused = !this.paused;
    if (this.paused) {
      this.stopReading();
    } else {
      this.initReading();
    }
  }

  init() {
    this.connectSerialPort();
    this.initParser();
    this.initReading();
  }

  debugger(property) {
    if (this.debug) {
      console.log('# ' + this.data[property].name + ' #');
      console.log(this.data[property].data);
    }
  }

  connectSerialPort() {
    this.serialPort = new SerialPort({
      path: this.portAddress,
      baudRate: this.baudRate,
    });
  }
  initParser() {
    // . Marvelmind delimiter pattern to separate messages on a data stream flow
    let delimiter = Buffer.from([0xff, 0x47]);
    this.parser = this.serialPort.pipe(
      new DelimiterParser({ delimiter: delimiter })
    );
    this.parser.marvelmind = this;
  }
  initReading() {
    this.parser.on('data', this.readMessage);
  }
  stopReading() {
    this.parser.off('data', this.readMessage);
  }

  readMessage(buffer) {
    // . Code reading consumes two bytes (Int16).
    let code = buffer.readUInt16LE();
    let initialOffset = 2;

    // . New data packet has arrived.
    this.marvelmind.emit('data', code);

    switch (code) {
      // Beacon Distances (mm) from Hedgehog (Packet of raw distances data)
      case 4: // code: 0x0004(uint_16)
        this.marvelmind.readRawDistances(buffer, initialOffset);
        break;
      // Battery (mV) and Received Signal Strength Indication - RSSI (Dbm) (Packet with telemetry data)
      case 6: // code: 0x0006(uint_16)
        this.marvelmind.readTelemetryData(buffer, initialOffset);
        break;
      // Quality Parameter (%) (Packet of positioning quality)
      case 7: // code: 0x0007(uint_16)
        this.marvelmind.readQualityData(buffer, initialOffset);
        break;
      // Hedgehog Coordinates (mm) (Packet of hedgehog coordinates)
      case 17: //  code: 0x0011(uint_16)
        this.marvelmind.readHedgehogMilimeter(buffer, initialOffset);
        break;
      // Beacons Coordinates (mm) (Zone mapping update?) (Packet of all beacons coordinates)
      case 18: // code: 0x0012(uint_16)
        this.marvelmind.readBeaconsMilimiter(buffer, initialOffset);
        break;
    }
  }

  readHedgehogMilimeter(buffer, offset) {
    // . Hedgehog coordinates
    let data = bufferpack.unpack('<BLLLLBBH', buffer, offset);
    // let packetSize = data[0];
    // let timestamp = data[1];
    let x = data[2];
    let y = data[3];
    let z = data[4];
    // let flags = data[5];
    let hedgehogAddress = data[6];
    // let orientation = data[7];

    // . Store New Data
    this.data.hedgehogMilimeter.data[hedgehogAddress] = {
      x: x,
      y: y,
      z: z,
    };

    // . New hedgehog coordinates (mm resolution) data packet has arrived.
    this.emit(
      'hedgehogMilimeter',
      hedgehogAddress,
      this.data.hedgehogMilimeter.data[hedgehogAddress]
    );

    this.debugger('hedgehogMilimeter');
  }

  readBeaconsMilimiter(buffer, offset) {
    let headerData = bufferpack.unpack('<BB', buffer, offset);
    // let packetSize = headerData[0];
    let nbeacons = headerData[1];
    offset += 2;
    let beaconsCoordinates = [],
      beaconData,
      marvelmindReserved;
    for (var i = 0; i < nbeacons; i++) {
      beaconData = bufferpack.unpack('<BLLLB', buffer, offset);
      if (beaconData) {
        beaconsCoordinates.push({
          beaconAddress: beaconData[0],
          x: beaconData[1],
          y: beaconData[2],
          z: beaconData[3],
        });
        // marvelmindReserved = beaconData[4];
      }
      offset += 14;
    }
    // . Store Beacon Data
    this.data.beaconsMilimeter.data = {};
    for (var i = 0; i < 4; i++) {
      this.data.beaconsMilimeter.data[beaconsCoordinates[i].beaconAddress] = {
        x: beaconsCoordinates[i].x,
        y: beaconsCoordinates[i].y,
        z: beaconsCoordinates[i].z,
      };
    }

    // . New beacon coordinates data packet has arrived.
    this.emit('beaconsMilimeter', this.data.beaconsMilimeter.data);

    this.debugger('beaconsMilimeter');
  }

  // let data = bufferpack.unpack('<BB     BLB BLB BLB BLB LH', buffer, offset);
  readRawDistances(buffer, offset) {
    // . Packet Data Unpacking
    let headerData = bufferpack.unpack('<BB', buffer, offset);
    // let packetSize = headerData[0];
    let hedgehogAddress = headerData[1];
    offset += 2;
    let distances = [];
    for (var i = 0; i < 4; i++) {
      let data = bufferpack.unpack('<BLB', buffer, offset);
      distances.push({
        beaconAddress: data[0],
        beaconDistance: data[1],
        isDistanceApplicable: data[2] % 2 === 0, //if number is odd(first bit equals 1), distance shouldn't be considered
      });
      offset += 6;
    }
    // let footerData = bufferpack.unpack('<LH', buffer, offset);
    // let timestamp = footerData[0];
    // let deltaTimeFromLastUltrasoundEmission = footerData[1];

    // . Store Beacon Data
    this.data.rawDistances.data[hedgehogAddress] = {};
    for (var i = 0; i < 4; i++) {
      this.data.rawDistances.data[hedgehogAddress][distances[i].beaconAddress] =
        {
          distance: distances[i].beaconDistance,
          isDistanceApplicable: distances[i].isDistanceApplicable,
        };
    }

    // . New raw distances data packet has arrived.
    this.emit(
      'rawDistances',
      hedgehogAddress,
      this.data.rawDistances.data[hedgehogAddress]
    );

    this.debugger('rawDistances');
  }

  readQualityData(buffer, offset) {
    // . Packet Data Unpacking
    let data = bufferpack.unpack('<BBBB', buffer, offset);
    // let packetSize = data[0];
    let hedgehogAddress = data[1];
    let quality = data[2]; // %
    let geofencingZoneIndex = data[3]; //If zero, no geofencing alarm was emmitted.

    // . Store New Data
    this.data.quality.data[hedgehogAddress] = {
      quality: quality,
      geofencingZoneIndex: geofencingZoneIndex,
    };

    // . New quality data packet has arrived.
    this.emit(
      'quality',
      hedgehogAddress,
      this.data.quality.data[hedgehogAddress]
    );

    this.debugger('quality');
  }

  readTelemetryData(buffer, offset) {
    // . Packet Data Unpacking
    let data = bufferpack.unpack('<BHBB', buffer, offset);
    // let packetSize = data[0];
    let battery = data[1];
    let RSSI = data[2];
    let deviceAddress = data[3];

    // . Store New Data
    this.data.telemetry.data[deviceAddress] = {
      battery: battery,
      RSSI: RSSI,
    };

    // . New telemtry data packet has arrived.
    this.emit(
      'telemetry',
      deviceAddress,
      this.data.telemetry.data[deviceAddress]
    );

    this.debugger('telemetry');
  }
}

module.exports = {
  Marvelmind,
};
