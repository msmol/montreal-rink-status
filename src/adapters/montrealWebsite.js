const request = require('request-promise');
const jsdom = require('jsdom');
const HtmlTableToJson = require('html-table-to-json');
const _ = require('lodash');

const { JSDOM } = jsdom;

function getRinkType(code) {
  if (code === 'OSR') return 'Open skate rink';
  if (code === 'TSR') return 'Team sports rink';
  if (code === 'LR') return 'Landscaped rink';
  if (code === 'PP') return 'N/A'; // TODO: figure out what this code is
  if (code === 'PPL') return 'N/A'; // TODO: figure out what this code is
  return 'N/A'
}

function getRinkName(rinkItem) {
  return _.upperFirst(rinkItem[1].split(', ')[1] || rinkItem[1].replace(/,/g, ''));
}

async function getRinkData() {
  const url = 'http://ville.montreal.qc.ca/portal/page?_pageid=5977,94954214&_dad=portal&_schema=PORTAL';

  const data = (await request(url, { encoding: 'latin1' }))
    .replace(/à/g, 'a')
    .replace(/ç/g, 'c')
    .replace(/é/g, 'e')
    .replace(/è/g, 'e');

  const dom = new JSDOM(data);

  const rinkTables = _.map(dom.window.document.querySelectorAll('.tabDonnees'), r => r.outerHTML);

  const rinkData = _.map(rinkTables, rt => (new HtmlTableToJson(rt)).results[0]);

  const cityNames = _.map(dom.window.document.querySelectorAll('h2'), c => c.innerHTML);

  return _.reduce(rinkData, (cityData, cityItem, index) => {
    const cityName = cityNames[index];
    cityData[_.snakeCase(cityName)] = {
      name: cityName,
      rinks: _.reduce(cityItem, (rinkData, rinkItem) => {
        const rinkDetails = rinkItem[1].split(', ')[1] ? rinkItem[1].split(', ')[0] : 'N/A';
        const rawRinkName = getRinkName(rinkItem);

        const rinkTypeCodeMatch = rawRinkName.match(/\((\w+)\)/);
        const rinkTypeCode = rinkTypeCodeMatch ? rinkTypeCodeMatch[1] : null;

        const rinkNameNoCode = rawRinkName.replace(` (${rinkTypeCode})`, '');

        const allRinkNames = _.map(cityItem, ri => getRinkName(ri));

        const rinkName = _.countBy(allRinkNames, name => name.includes(rinkNameNoCode)).true > 1 ?
          rawRinkName :
          rinkNameNoCode;

        rinkData[_.snakeCase(rinkName)] = _.chain(rinkItem)
          .set('details', rinkDetails)
          .set('type', getRinkType(rinkTypeCode))
          .set('name', rinkName)
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
      }, {}),
    };

    return cityData;
  }, {});
}

module.exports = {
  getRinkData,
};