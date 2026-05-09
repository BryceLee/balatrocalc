'use strict';

require('dotenv').config({ quiet: true });

const { google } = require('googleapis');

function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function createGoogleOAuthClient() {
    const clientId = requireEnv('GOOGLE_CLIENT_ID');
    const clientSecret = requireEnv('GOOGLE_CLIENT_SECRET');
    const refreshToken = requireEnv('GOOGLE_REFRESH_TOKEN');

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({
        refresh_token: refreshToken,
    });

    return oauth2Client;
}

function isTokenError(error) {
    const message = String(error?.message ?? '').toLowerCase();
    const status = error?.code ?? error?.response?.status;
    const reason = error?.errors?.[0]?.reason ?? error?.response?.data?.error;

    return status === 401
        || reason === 'invalid_grant'
        || message.includes('invalid_grant')
        || message.includes('invalid client')
        || message.includes('unauthorized_client')
        || message.includes('refresh token');
}

function getGoogleErrorMessage(error) {
    return error?.response?.data?.error_description
        || error?.response?.data?.error
        || error?.errors?.[0]?.message
        || error?.message
        || String(error);
}

module.exports = {
    createGoogleOAuthClient,
    getGoogleErrorMessage,
    isTokenError,
    requireEnv,
};
