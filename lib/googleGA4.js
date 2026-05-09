'use strict';

const { google } = require('googleapis');
const {
    createGoogleOAuthClient,
    getGoogleErrorMessage,
    isTokenError,
    requireEnv,
} = require('./googleOAuth');

function normalizeGA4Error(error) {
    const status = error?.code ?? error?.response?.status;
    const message = getGoogleErrorMessage(error);
    const lowerMessage = message.toLowerCase();

    if (isTokenError(error)) {
        return new Error('Google OAuth token error. Check GOOGLE_REFRESH_TOKEN, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET.');
    }

    if (status === 403) {
        return new Error('GA4 returned 403. The OAuth Google account may not have GA4 Viewer access, or the analytics.readonly scope is incorrect.');
    }

    if (lowerMessage.includes('property') && lowerMessage.includes('not found')) {
        return new Error('GA4 property not found. Check GA4_PROPERTY_ID and confirm the OAuth Google account has access.');
    }

    if (
        (lowerMessage.includes('invalid') || lowerMessage.includes('not a valid') || lowerMessage.includes('unknown'))
        && (lowerMessage.includes('metric') || lowerMessage.includes('dimension'))
    ) {
        return new Error(`GA4 invalid metric/dimension. Check metrics and dimensions names. Original error: ${message}`);
    }

    return new Error(`GA4 report request failed: ${message}`);
}

function parseMetricValue(value) {
    if (value === undefined || value === null || value === '') {
        return 0;
    }

    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? value : numberValue;
}

function flattenGA4Rows(report, dimensions, metrics) {
    return (report.rows || []).map((row) => {
        const record = {};

        dimensions.forEach((name, index) => {
            record[name] = row.dimensionValues?.[index]?.value || '';
        });

        metrics.forEach((name, index) => {
            record[name] = parseMetricValue(row.metricValues?.[index]?.value);
        });

        return record;
    });
}

async function getGA4Report(options) {
    const {
        startDate,
        endDate,
        dimensions = ['date'],
        metrics = ['activeUsers', 'sessions', 'screenPageViews'],
    } = options || {};

    if (!startDate || !endDate) {
        throw new Error('getGA4Report requires startDate and endDate.');
    }

    const auth = createGoogleOAuthClient();
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth });
    const propertyId = requireEnv('GA4_PROPERTY_ID');
    const property = `properties/${propertyId}`;

    try {
        const response = await analyticsData.properties.runReport({
            property,
            requestBody: {
                dateRanges: [{ startDate, endDate }],
                dimensions: dimensions.map((name) => ({ name })),
                metrics: metrics.map((name) => ({ name })),
            },
        });

        return flattenGA4Rows(response.data, dimensions, metrics);
    } catch (error) {
        throw normalizeGA4Error(error);
    }
}

module.exports = {
    getGA4Report,
};
