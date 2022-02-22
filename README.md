# marvelmind.js

**Javascript Library for Marvelmind GPS**

_**Marlvelmind.js**_ includes two small Javascript classes for receiving and parsing data from Marvelmind mobile beacon by USB/serial port.

This code contains a **CLIENT** and a **SERVER** utility classes. Both classes parse data using [bufferpack](https://www.npmjs.com/package/bufferpack) and [Marvelmind Instructions](https://marvelmind.com/pics/marvelmind_interfaces.pdf) (v7.00). They apply a similar approach to read incoming data, but differ significantly on how data is received and parsed.

The **client** class is built upon [WebUSB API](https://developer.mozilla.org/en-US/docs/Web/API/WebUSB_API), an experimental technology which, up to this date, is only supported by Chromium Based Browsers (Google Chrome, Edge, Opera, ...). Parsing incoming data chunks into readable message is performed by a custom parser.

The **server** class of this code uses a serial port library, [serialport](https://www.npmjs.com/package/serialport), to acquire data stream. Parsing is conviniently done with [parser-delimiter](https://serialport.io/docs/api-parser-delimiter).

Events are emitted using [EventEmitter](https://github.com/Olical/EventEmitter) and [native Node.js Events API](https://nodejs.org/api/events.html) for client and server classes, respectively.

## How to Test

Please, ensure that all deploying instructions by Marvelmind have been thoroughly followed. Remember to update all SW Firmware, setup Beacon positioning, turn them ON, adjust Maps and Submaps and connect the USB Modem on your computer. It's mandatory to install the STM32 Driver to get modem data via USB.

**Note:** Don't forget to ensure Marvelmind Dashboard is closed when testing this code - only one program (a Node.js server, a web browser or the Marvelmind Dashboard) is allowed to receive data stream from the USB Modem at a specific port and time.

**Note 2:** Some data stream are disabled by default. For example, quality and telemetry streams require that options “Quality and extended location data” and “Telemetry stream” are enabled, respectively. Visit the Dashboard, select a device and go under _Interfaces_ to see more.

### Client version

> - Open _/client/test.html_
> - Click on **Connect GPS Modem**
> - Select the Marvelmind Modem.
> - Incoming data will be logged on console. Enjoy!

### Server version

> - Verify the USB Serial port address used in your OS. This address may vary significantly on Windows, Linux and MacOS devices. Update it on the _portAddress_ argument. For example, if your USB port address is COM3:
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

## How to Use

#### Events:

Both classes emit Events to transfer incoming data. Here follows a comprehensive list:

|   Event String    | Content                                         | Marvelmind Code |   Version   |
| :---------------: | ----------------------------------------------- | :-------------: | :---------: |
|   rawDistances    | Beacon Distances (mm)                           |   0x0004 (4)    |    Both     |
|     telemetry     | Battery (mV) and RSSI (Dbm)                     |   0x0006 (6)    |    Both     |
|      quality      | Quality Parameter (%) and Geofencing Zone Index |   0x0007 (7)    |    Both     |
| hedgehogMilimeter | Hedgehog Coordinates (mm)                       |   0x0011 (17)   |    Both     |
| beaconsMilimeter  | Beacons Coordinates (mm)                        |   0x0012 (18)   |    Both     |
|     connected     | None                                            |   -----------   | Client Only |
|   disconnected    | None                                            |   -----------   | Client Only |

### Client version

```
    <script src="assets/js/bufferpack.js"></script>
    <script src="assets/js/EventEmitter.js"></script>
    <script src="marvelmind.js"></script>
    <script>
        let marvelmind = new Marvelmind();
        marvelmind.on('hedgehogMilimeter', (hedgehogAddress, hedgehogCoordinates) => {
            console.log(hedgehogAddress, hedgehogCoordinates);
        });
        marvelmind.toggleConnection(); //Requires user interaction first!
    </script>

```

#### Attributes:

> **baudRate** - baudrate. Should match baudrate of hedgehog-beacon.
>
> _Default value: 9600_
>
> **debug** - debug flag. Activates console output.
>
> _Default value: False_

#### Methods:

> **toggleConnection( )** - Toggle serial port connection.
>
> **Note:** Modern browser policy requires that users interact with the site before allowing a WebUSB connection. For example, on _/client/test.html_, a click event is used to ensure user interaction.

### Server version

```
const { Marvelmind } = require('./marvelmind');
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
> **baudRate** - baudrate. Should match baudrate of hedgehog-beacon.
>
> _Default value: 9600_
>
> **debug** - debug flag. Activates console output.
>
> _Default value: False_
>
> **paused** - pause flag. If **true**, instance will not parse serial data when created. To start data parsing, use **toggleReading**.
>
> _Default value: False_

#### Methods:

> **toggleReading( )** - Toggle data reading.

## _Acknowledgements_

This repository is inspired by a former repository of [Joshua J. Damanik](https://github.com/joshuadamanik/) which implemented Marvelmind data processing on Node.js. Additionally, some opinionated choices have been inspired by [marvelmind.py](https://github.com/MarvelmindRobotics/marvelmind.py) for consistency.

## _Contact_

Please reach murilohoias@gmail.com
