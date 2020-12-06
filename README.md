# Homebridge Garage ESP8266
Garage door opener accessory that interacts with an ESP8266 connected to a relay.

## Config
Place this inside of the `accessories` array in your homebridge config. Make sure to replace the urls with the endpoints for your system.
Polling time is how often this plugin will check the state of the garage (in milliseconds, default is 5 seconds). Door opening time is how long your garage take to open/close in milliseconds.

```json
{
    "accessory": "GarageOpenerESP8266",
    "name": "ESP8266 Garage Opener",
    "stateUrl": "garage.local/api/state",
    "openUrl": "garage.local/api/targetState",
    "closeUrl": "garage.local/api/targetState",
    "pollingTime": 5000,
    "doorOpeningTime": 14000
}
```
