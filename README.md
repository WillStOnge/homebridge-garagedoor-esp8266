# Homebridge Garage ESP8266
Garage door opener accessory that interacts with an ESP8266 connected to a relay.

## Config
Place this inside of the `accessories` array in your homebridge config. Make sure to replace the fields with their proper values.

```json
{
    "accessory": "GarageOpenerESP8266",
    "name": "ESP8266 Garage Opener",
    "triggerUrl": "garage.local/trigger",
    "openUrl": "garage.local/isopen",
    "closedUrl": "garage.local/isclosed",
    "pollingTime": 5000,
    "doorOpeningTime": 14000
}
```
## Fields
`accessory`: Do not modify this since it is linked to the plugin in Homebridge.
`name`: This is the default name you will see in the Home app.
`triggerUrl`: Endpoint on the ESP8266 to trigger the door.
`openUrl`: Endpoint on the ESP8266 to check if the door is open.
`closedUrl`: Endpoint on the ESP8266 to check if the door is closed.
`pollingTime`: How often this plugin will check the state of the door (milliseconds).
`doorOpeningTime`: How long it takes the door to fully open/close (milliseconds).
