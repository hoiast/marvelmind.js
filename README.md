# marvelmind.js

**Javascript Library for Marvelmind GPS**

Marlvelmind.js includes two small Javascript classes for receiving and parsing data from Marvelmind mobile beacon by USB/serial port.

This code is divided in two sections - a **CLIENT** utility class and a **SERVER** utility class. Both classes parse data using [bufferpack](https://www.npmjs.com/package/bufferpack) and [Marvelmind Instructions](https://marvelmind.com/pics/marvelmind_interfaces.pdf) (v7.00) and apply a similar approach to parse incoming data, but differ significantly on how data is received.

The client library is built upon [WebUSB API](https://developer.mozilla.org/en-US/docs/Web/API/WebUSB_API), an experimental technology which, up to this date, is only supported by Chromium Based Browsers (Google Chrome, Edge, Opera, ...). The server version of this code uses a serial port library, [serialport](https://www.npmjs.com/package/serialport), to acquire data stream.

## How to Test

Please, ensure that all deploying instructions by Marvelmind have been thoroughly followed. Remember to update all SW Firmware, setup Beacon positioning, turn them ON and adjust Maps and Submaps and connect the USB Modem on your computer. It's mandatory to install the STM32 Driver to get data via USB.

**Note:** Don't forget to ensure Marvelmind Dashboard is closed when testing this code - only one program (Node.js, your Browser or Marvelmind Dashboard) is allowed to receive data stream from the USB Modem at a specific port and time.

**Note 2:** Some data stream are disabled by default. For example, quality and telemetry streams require that options “Quality and extended location data” and “Telemetry stream” are enabled, respectively. Visit the Dashboard, select a device and go under _Interfaces_ to see more.

### Client version

> - Open _/client/test/index.html_
> - Click on **Connect GPS Modem**
> - Select the Marvelmind Modem.
> - Incoming data will be logged on console. Enjoy!

### Server version

> - Verify the USB Serial port address used in your OS. This address my vary significantly on Windows, Linux and MacOS devices. Update it on the _portAddress_ argument. For example, if your USB port address is COM3:
>
> ```
> let marvelmind = new Marvelmind({portAddress:'COM3'})
> ```
>
> - On the _/server/_ folder, run:
>
> ```
> npm install
> npm run test
> ```
>
> - Incoming data will be logged on console. Enjoy!

## How to Uuse

### Client version

### Server version

```
const marvelmind = new Marvelmind();
marvelmind.on('hedgehogMilimeter', (hedgehogAddress, hedgehogCoordinates) => {
  console.log(hedgehogAddress, hedgehogCoordinates);
});
```

#### Attributes:

> **portAddress** - serial port device name (physical or USB/virtual). It should be provided as an argument:
> _Default value: 'COM3'_
>
> - '/dev/ttyACM0' - typical for Linux
> - '/dev/tty.usbmodem1451' - typical for Mac OS X
> - 'COM3' to 'COM6' - typical for Windows
>
> **baudRate** - baudrate. Should be match to baudrate of hedgehog-beacon
> _Default value: 9600_
>
> **debug** - debug flag which activate console output
> _Default value: False_
>
> **paused** - pause flag. If True, class would not parse serial data
> _Default value: False_

#### Methods:

> **toggleReading** - Toggle data parsing.

#### Events:

> **beaconsMilimeter** - Beacon Distances (mm) - code: 0x0004
> **telemetry** - Battery (mV) and RSSI (Dbm) - code: 0x0006
> **quality** - Quality Parameter (%) - code: 0x0007
> **rawDistances** - Hedgehog Coordinates (mm) - code: 0x0011
> **hedgehogMilimeter** - Beacons Coordinates (mm) - code: 0x0012

## _Credits_

This repository is inspired by a former repository of [Joshua J. Damanik](https://github.com/joshuadamanik/) which implemented Marvelmind data processing on Node.js. Additionally, some opinionated choices have been inspired by [marvelmind.py](https://github.com/MarvelmindRobotics/marvelmind.py) for consistency.

## _Contact_

Please reach murilohoias@gmail.com
