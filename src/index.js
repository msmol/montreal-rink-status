const express = require('express');
const _ = require('lodash');

const montrealWebsiteAdapter = require('./adapters/montrealWebsite');

const app = express();

app.get('/rinks', async (req, res) => {
  return res.status(200).json(await montrealWebsiteAdapter.getRinkData());
});

app.get('/rinks/:city', async (req, res, next) => {
  const rinks = await montrealWebsiteAdapter.getRinkData();
  return rinks[req.params.city] ? res.status(200).json(rinks[req.params.city]) : next();
});

app.get('/rinks/:city/:rinkName', async (req, res, next) => {
  const rinks = await montrealWebsiteAdapter.getRinkData();
  return _.get(rinks, `[${req.params.city}].rinks[${req.params.rinkName}]`) ?
    res.status(200).json(rinks[req.params.city].rinks[req.params.rinkName]) :
    next();
});

app.use((req, res) => {
  return res.status(404).json({
    error: 'Not Found',
  });
});

app.use((req, res, next, err) => {
  return res.status(500).json({
    error: 'Something bad happened',
  });
});

app.listen(8000, () => {
  console.log('Listening on port 8000...');
});