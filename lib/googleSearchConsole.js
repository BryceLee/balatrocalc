'use strict';

const { google } = require('googleapis');
const {
    createGoogleOAuthClient,
    getGoogleErrorMessage,
    isTokenError,
    requireEnv,
} = require('./googleOAuth');

function isSiteUrlError(error) {
    const message = getGoogleErrorMessage(error).toLowerCase();
    return message.includes('site not found')
        || message.includes('no matching site')
        || message.includes('not a valid site url')
        || message.includes('not found');
}

function normalizeSearchConsoleError(error) {
    const status = error?.code ?? error?.response?.status;

    if (isTokenError(error)) {
        return new Error('Google OAuth token error. Check GOOGLE_REFRESH_TOKEN, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET.');
    }

    if (status === 403) {
        return new Error('Google Search Console returned 403. The OAuth Google account may not have GSC access, or the token/scope is incorrect.');
    }

    if (isSiteUrlError(error)) {
        return new Error('Google Search Console site not found. Check GSC_SITE_URL. For this Domain Property use sc-domain:balatrocalc.com, not https://balatrocalc.com/.');
    }

    return new Error(`Google Search Console request failed: ${getGoogleErrorMessage(error)}`);
}

async function getSearchConsolePerformance(options) {
    const {
        startDate,
        endDate,
        dimensions = ['query', 'page'],
        rowLimit = 100,
    } = options || {};

    if (!startDate || !endDate) {
        throw new Error('getSearchConsolePerformance requires startDate and endDate.');
    }

    const auth = createGoogleOAuthClient();
    const searchconsole = google.searchconsole({ version: 'v1', auth });
    const siteUrl = requireEnv('GSC_SITE_URL');

    try {
        const response = await searchconsole.searchanalytics.query({
            siteUrl,
            requestBody: {
                startDate,
                endDate,
                dimensions,
                rowLimit,
            },
        });

        return response.data.rows || [];
    } catch (error) {
        throw normalizeSearchConsoleError(error);
    }
}

module.exports = {
    getSearchConsolePerformance,
};
