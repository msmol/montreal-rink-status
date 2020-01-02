const request = require('request-promise');
const jsdom = require('jsdom');
const HtmlTableToJson = require('html-table-to-json');
const _ = require('lodash');

const { JSDOM } = jsdom;

async function getRinkData() {
  const url = 'http://ville.montreal.qc.ca/portal/page?_pageid=5977,94954214&_dad=portal&_schema=PORTAL';

  const data = await request(url);

  const dom = new JSDOM(data);

  const rinkTables = _.map(dom.window.document.querySelectorAll('.tabDonnees'), r => r.outerHTML);

  const rinkData = _.map(rinkTables, rt => (new HtmlTableToJson(rt)).results[0]);

  const cityNames = _.map(dom.window.document.querySelectorAll('h2'), c => c.innerHTML);

  return _.reduce(rinkData, (cityData, cityItem, index) => {
    cityData[cityNames[index]] = _.reduce(cityItem, (rinkData, rinkItem) => {
      const rinkDetails = rinkItem[1].split(', ')[0];
      const rinkName = rinkItem[1].split(', ')[1] || rinkItem[1].replace(/,/g, '');

      rinkData[rinkName] = _.chain(rinkItem)
        .set('details', rinkDetails)
        .omit(1)
        .mapKeys((val, key) => _.toLower(key))
        .mapValues((item) => {
          if (item === 'No') {
            return false;
          } else if (item === 'Yes') {
            return true;
          } else {
            return item;
          }
        })
        .value();

      return rinkData;
    }, {});

    return cityData;
  }, {});
}

module.exports = {
  getRinkData,
};