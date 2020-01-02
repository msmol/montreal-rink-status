# montreal-rink-status

Quick and dirty parsing of the city of Montreal's outdoor rink status page

## Endpoints

The app exposes the following endpoints (port 8000):

- `GET /rinks` list all rink info
- `GET /rinks/:cityName` list all the rinks for a given city
- `GET /rinks/:cityName/:rinkName` get the details for a specific rink

## Issues

- Character encoding issues for city names, rink names, rink details