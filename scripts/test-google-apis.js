#!/usr/bin/env node
'use strict';

require('dotenv').config({ quiet: true });

const { getSearchConsolePerformance } = require('../lib/googleSearchConsole');
const { getGA4Report } = require('../lib/googleGA4');

function toDateString(date) {
    return date.toISOString().slice(0, 10);
}

function getRecentDateRange() {
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - 1);
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - 6);

    return {
        startDate: toDateString(start),
        endDate: toDateString(end),
    };
}

async function main() {
    const gscRange = getRecentDateRange();

    const gscRows = await getSearchConsolePerformance({
        startDate: gscRange.startDate,
        endDate: gscRange.endDate,
        dimensions: ['query', 'page'],
        rowLimit: 10,
    });

    console.log('GSC first 10 rows:');
    console.table(gscRows.slice(0, 10));

    const ga4Rows = await getGA4Report({
        startDate: '7daysAgo',
        endDate: 'today',
        dimensions: ['date'],
        metrics: ['activeUsers', 'sessions', 'screenPageViews'],
    });

    console.log('GA4 last 7 days:');
    console.table(ga4Rows);
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
