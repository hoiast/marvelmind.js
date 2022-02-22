/*
 * marvelmind.js v0.0.1 - https://github.com/hoiast/marvelmind.js
 * MIT License - https://choosealicense.com/licenses/mit/
 * Murilo Hoias Teixeira - https://github.com/hoiast
 */

class Marvelmind extends EventEmitter {
  constructor({ baudRate = 9600, debug = false } = {}) {
    super();

    // . Initialize User Configuration
    this.baudRate = baudRate;
    this.debug = debug;

    // . Init properties
    this.serialPort = null;
    this.parser = null;
    this.keepReading = false;
    this.connected = false;
    this.reader = null;
    this.closedPromise = null;
    this.buffer = new Uint8Array();
    this.data = {
      hedgehogMilimeter: { name: 'Hedgehog Coordinates (mm)', data: {} }, //hedgehogAddress: { x: int, y: int, z: int}
      beaconsMilimeter: { name: 'Beacons Coordinates (mm)', data: {} }, //deviceAddress: { x: int, y: int, z: int}
      rawDistances: { name: 'Beacon Distances (mm)', data: {} }, // hedgehogAddress: { beacondAddress: {distance: int, isDistanceApplicable: bool}
      quality: { name: 'Quality Parameter (%)', data: {} }, //hedgehogAddress: {quality: int, geofencingZoneIndex: int}
      telemetry: { name: 'Battery (mV) and RSSI (Dbm)', data: {} }, //deviceAddress: { battery: int, RSSI: int}
    };
  }

  toggleConnection() {
    if (this.connected) {
      this.disconnectSerialPort();
    } else {
      this.connectSerialPort();
    }
  }

  debugger(property) {
    if (this.debug) {
      console.log('# ' + this.data[property].name + ' #');
      console.log(this.data[property].data);
    }
  }

  async disconnectSerialPort() {
    this.keepReading = false;
    // . Force reader.read() to resolve immediately and subsequently call reader.releaseLock().
    this.reader.cancel();
    await this.closedPromise;
    this.connected = false;
    this.emit('disconnected');
    // . Reset buffer.
    this.buffer = new Uint8Array();
  }

  async connectSerialPort() {
    this.serialPort = await navigator.serial.requestPort({
      filters: [{ usbVendorId: 1155 }],
    });
    this.keepReading = true;
    await this.serialPort.open({ baudRate: this.baudRate });
    this.connected = true;
    this.emit('connected');
    this.closedPromise = this.readUntilClosed();
  }

  async readUntilClosed() {
    while (this.serialPort.readable && this.keepReading) {
      this.reader = this.serialPort.readable.getReader();
      try {
        while (true) {
          const { value, done } = await this.reader.read();
          if (done) {
            // . reader.cancel() has been called.
            break;
          }

          this.buffer = this.customParser(this.buffer, value);
        }
      } catch (error) {
        // . Handle error...
      } finally {
        // . Allow the serial port to be closed later.
        this.reader.releaseLock();
      }
    }

    await this.serialPort.close();
    this.connected = false;
  }

  customParser(buffer, value) {
    let temp, parsedMessagesStrings, messageString, message;
    // . Merge incoming chunk (value) to queued buffer.
    temp = new Uint8Array(buffer.length + value.length);
    temp.set(buffer);
    temp.set(value, buffer.length);
    let bufferFull = temp; //bufferFull is the sum of previous buffer with incoming data chunk.

    // . Try to split the recently merged buffer looking for a delimiter pair of (255, 71) i.e. (0xff, 0x47).
    parsedMessagesStrings = bufferFull.toString().split('255,71,');
    // . Gather all splitted messages (all, but last one) and process them.
    // . . Ignore last message and return it to buffer. The last message may be incomplete.
    let bufferToReturn = new Uint8Array(parsedMessagesStrings.pop().split(','));

    // . Process parsed messages
    for (messageString of parsedMessagesStrings) {
      message = new Uint8Array(messageString.split(','));
      this.readMessage(message);
    }

    // . Return last buffer segment to merge with new incoming chunks.
    return bufferToReturn;
  }

  readMessage(buffer) {
    // . Code reading consumes two bytes (Int16).
    let code = buffer[0];
    let initialOffset = 2;

    switch (code) {
      // . Beacon Distances (mm) from Hedgehog (Packet of raw distances data)
      case 4: // code: 0x0004(uint_16)
        this.readRawDistances(buffer, initialOffset);
        break;
      // . Battery (mV) and Received Signal Strength Indication - RSSI (Dbm) (Packet with telemetry data)
      case 6: // code: 0x0006(uint_16)
        this.readTelemetryData(buffer, initialOffset);
        break;
      // . Quality Parameter (%) (Packet of positioning quality)
      case 7: // code: 0x0007(uint_16)
        this.readQualityData(buffer, initialOffset);
        break;
      // . Hedgehog Coordinates (mm) (Packet of hedgehog coordinates)
      case 17: //  code: 0x0011(uint_16)
        this.readHedgehogMilimeter(buffer, initialOffset);
        break;
      // . Beacons Coordinates (mm) (Zone mapping update?) (Packet of all beacons coordinates)
      case 18: // code: 0x0012(uint_16)
        this.readBeaconsMilimiter(buffer, initialOffset);
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
      if (beaconsCoordinates[i] !== undefined) {
        this.data.beaconsMilimeter.data[beaconsCoordinates[i].beaconAddress] = {
          x: beaconsCoordinates[i].x,
          y: beaconsCoordinates[i].y,
          z: beaconsCoordinates[i].z,
        };
      }
    }

    // . New beacon coordinates data packet has arrived.
    this.emit('beaconsMilimeter', this.data.beaconsMilimeter.data);

    this.debugger('beaconsMilimeter');
  }

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
        isDistanceApplicable: data[2] % 2 === 0, //if number is odd (first bit equals 1), distance shouldn't be considered
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
