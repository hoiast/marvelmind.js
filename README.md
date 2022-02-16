# marvelmind.js

## Javascript Library for Marvelmind GPS

Marlvelmind.js includes two small Javascript classes for receiving and parsing data from Marvelmind mobile beacon by USB/serial port.

This code is divided in two sections - a **CLIENT** utility class and a **SERVER** utility class. Both classes parse data using [bufferpack](https://www.npmjs.com/package/bufferpack) and [Marvelmind Instructions](https://marvelmind.com/pics/marvelmind_interfaces.pdf)(v7.00) and apply a similar approach to parse incoming data, but differ significantly on how data is received.

The client library is built upon [WebUSB API](https://developer.mozilla.org/en-US/docs/Web/API/WebUSB_API), an experimental technology which, up to this date, is only supported by Chromium Based Browsers (Google Chrome, Edge, Opera, ...). The server version uses a serial port library, [serialport](https://www.npmjs.com/package/serialport).

### How to test

Please, ensure that all deploying instructions by Marvelmind have been thoroughly followed. Remember to update all SW Firmware, setup Beacon positioning, turn them ON and adjust Maps and Submaps. It's mandatory to install the STM32 Driver to get data via USB. Don't forget to close the Marvelmind Dashboard when testing this code - only one program (Node.js, Browser or Marvelmind Dashboard) is allowed to receive a data stream at a specific port at the same time.

#### Client

- Connect your Marvelmind Modem using an USB cable.
- Open _/client/test/index.html_
- Click on **Connect GPS Modem**
- Select the Marvelmind Modem. Incoming data will be logged on console.

#### Server

- Connect your Marvelmind Modem using an USB cable.
- Verify the USB Serial port address used in your OS. This address my vary significantly on Windows, Linux and MacOS devices. Update it on the _portAddress_ argument. For example, if your USB port address is COM6:

```
let marvelmind = new Marvelmind({portAddress:'COM6'})
```

- Run node app in the _/server/test_ folder. Incoming data will be logged on console.

### How to use

### _Credits_

This repository is lightly based on a former repository of [Joshua J. Damanik](https://github.com/joshuadamanik/) which approached Marvelmind data processing on Node.js. Additionally, some ideas used here have been inspired by [marvelmind.py](https://github.com/MarvelmindRobotics/marvelmind.py).

### _Contact_

Please reach murilohoias@gmail.com
