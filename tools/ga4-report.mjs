#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const defaultCredentialsPath = path.join(repoRoot, '.ga4', 'oauth-client.json');
const defaultTokenPath = path.join(repoRoot, '.ga4', 'oauth-token.json');
const analyticsScope = 'https://www.googleapis.com/auth/analytics.readonly';

function parseArgs(argv) {
    const args = {};

    for (let index = 0; index < argv.length; index += 1) {
        const entry = argv[index];

        if (!entry.startsWith('--')) {
            continue;
        }

        const [rawKey, inlineValue] = entry.slice(2).split('=', 2);
        const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

        if (inlineValue !== undefined) {
            args[key] = inlineValue;
            continue;
        }

        const next = argv[index + 1];
        if (!next || next.startsWith('--')) {
            args[key] = true;
            continue;
        }

        args[key] = next;
        index += 1;
    }

    return args;
}

function printHelp() {
    console.log(`
Usage:
  node tools/ga4-report.mjs --property 503084872

Options:
  --property <id>          GA4 property ID.
  --credentials <path>     OAuth client JSON path. Default: .ga4/oauth-client.json
  --token <path>           OAuth token JSON path. Default: .ga4/oauth-token.json
  --start-date <value>     Default report start date. Default: 28daysAgo
  --end-date <value>       Default report end date. Default: today
  --dimensions <a,b,c>     Default report dimensions. Default: pagePath,pageTitle
  --metrics <a,b,c>        Default report metrics. Default: screenPageViews,activeUsers,sessions
  --limit <n>              Default report row limit. Default: 25
  --body <path>            Custom runReport JSON body path.
  --json                   Print raw JSON instead of console.table.
  --force-consent          Force a fresh browser consent flow.
  --help                   Show this help.

Environment variable fallbacks:
  GA4_PROPERTY_ID
  GA4_CLIENT_ID
  GA4_CLIENT_SECRET
  GA4_OAUTH_CREDENTIALS
  GA4_OAUTH_TOKEN
`);
}

async function readJson(filePath) {
    const source = await fs.readFile(filePath, 'utf8');
    return JSON.parse(source);
}

async function ensureDir(filePath) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function randomBase64Url(bytes = 32) {
    return crypto.randomBytes(bytes).toString('base64url');
}

function sha256Base64Url(input) {
    return crypto.createHash('sha256').update(input).digest('base64url');
}

function normalizeClientCredentials(raw) {
    const payload = raw.installed ?? raw.web ?? raw;
    const clientId = payload.client_id ?? process.env.GA4_CLIENT_ID;
    const clientSecret = payload.client_secret ?? process.env.GA4_CLIENT_SECRET ?? '';

    if (!clientId) {
        throw new Error('Missing OAuth client_id. Save the downloaded client JSON to .ga4/oauth-client.json or set GA4_CLIENT_ID.');
    }

    return {
        clientId,
        clientSecret,
        authUri: payload.auth_uri ?? 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUri: payload.token_uri ?? 'https://oauth2.googleapis.com/token',
    };
}

async function loadClientCredentials(credentialsPath) {
    if (process.env.GA4_CLIENT_ID) {
        return normalizeClientCredentials({});
    }

    const raw = await readJson(credentialsPath);
    return normalizeClientCredentials(raw);
}

async function maybeReadToken(tokenPath) {
    try {
        return await readJson(tokenPath);
    } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}

async function writeToken(tokenPath, token) {
    await ensureDir(tokenPath);
    await fs.writeFile(tokenPath, `${JSON.stringify(token, null, 2)}\n`, 'utf8');
}

async function openBrowser(url) {
    const platform = process.platform;

    try {
        if (platform === 'darwin') {
            await execFileAsync('open', [url]);
            return true;
        }

        if (platform === 'win32') {
            await execFileAsync('cmd', ['/c', 'start', '', url]);
            return true;
        }

        await execFileAsync('xdg-open', [url]);
        return true;
    } catch {
        return false;
    }
}

function createLoopbackServer() {
    return new Promise((resolve, reject) => {
        const server = http.createServer();
        server.on('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const address = server.address();
            if (!address || typeof address === 'string') {
                reject(new Error('Failed to start loopback server for OAuth callback.'));
                return;
            }
            resolve({ server, port: address.port });
        });
    });
}

async function requestInteractiveToken(client, tokenPath) {
    const { server, port } = await createLoopbackServer();
    const redirectUri = `http://127.0.0.1:${port}`;
    const state = randomBase64Url(24);
    const codeVerifier = randomBase64Url(64);
    const codeChallenge = sha256Base64Url(codeVerifier);

    const authUrl = new URL(client.authUri);
    authUrl.searchParams.set('client_id', client.clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', analyticsScope);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    const completion = new Promise((resolve, reject) => {
        server.on('request', (req, res) => {
            const incomingUrl = new URL(req.url ?? '/', redirectUri);
            if (incomingUrl.pathname !== '/') {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Not found.');
                return;
            }

            const receivedState = incomingUrl.searchParams.get('state');
            const error = incomingUrl.searchParams.get('error');
            const code = incomingUrl.searchParams.get('code');

            if (error) {
                res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(`Google OAuth failed: ${error}`);
                reject(new Error(`Google OAuth failed: ${error}`));
                return;
            }

            if (receivedState !== state || !code) {
                res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('OAuth callback validation failed.');
                reject(new Error('OAuth callback validation failed.'));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('GA4 authorization complete. You can close this tab and return to the terminal.');
            resolve({ code, redirectUri, codeVerifier });
        });
    });

    const browserOpened = await openBrowser(authUrl.toString());
    console.log(browserOpened
        ? 'Opened the Google consent page in your browser.'
        : 'Open this URL in your browser to continue OAuth:');
    console.log(authUrl.toString());

    let authResult;
    try {
        authResult = await completion;
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }

    const body = new URLSearchParams({
        client_id: client.clientId,
        code: authResult.code,
        code_verifier: authResult.codeVerifier,
        grant_type: 'authorization_code',
        redirect_uri: authResult.redirectUri,
    });

    if (client.clientSecret) {
        body.set('client_secret', client.clientSecret);
    }

    const response = await fetch(client.tokenUri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    });

    const json = await response.json();
    if (!response.ok) {
        throw new Error(`Token exchange failed: ${JSON.stringify(json)}`);
    }

    const token = {
        ...json,
        expires_at: Date.now() + (json.expires_in ?? 0) * 1000,
    };

    await writeToken(tokenPath, token);
    return token;
}

async function refreshAccessToken(client, tokenPath, token) {
    if (!token.refresh_token) {
        return requestInteractiveToken(client, tokenPath);
    }

    const body = new URLSearchParams({
        client_id: client.clientId,
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token,
    });

    if (client.clientSecret) {
        body.set('client_secret', client.clientSecret);
    }

    const response = await fetch(client.tokenUri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    });

    const json = await response.json();
    if (!response.ok) {
        console.warn(`Refresh token failed, falling back to fresh consent: ${JSON.stringify(json)}`);
        return requestInteractiveToken(client, tokenPath);
    }

    const nextToken = {
        ...token,
        ...json,
        refresh_token: json.refresh_token ?? token.refresh_token,
        expires_at: Date.now() + (json.expires_in ?? 0) * 1000,
    };

    await writeToken(tokenPath, nextToken);
    return nextToken;
}

async function getAccessToken(client, tokenPath, forceConsent) {
    const token = forceConsent ? null : await maybeReadToken(tokenPath);
    if (!token) {
        return requestInteractiveToken(client, tokenPath);
    }

    const expiresAt = token.expires_at ?? 0;
    const shouldRefresh = expiresAt <= Date.now() + 60_000;
    if (shouldRefresh) {
        return refreshAccessToken(client, tokenPath, token);
    }

    return token;
}

function csvToNames(value, fallback) {
    const source = value ?? fallback;
    return source
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

async function buildRequestBody(args) {
    if (typeof args.body === 'string') {
        const bodyPath = path.resolve(repoRoot, args.body);
        return readJson(bodyPath);
    }

    const dimensions = csvToNames(args.dimensions, 'pagePath,pageTitle');
    const metrics = csvToNames(args.metrics, 'screenPageViews,activeUsers,sessions');
    const primaryMetric = metrics[0];

    return {
        dateRanges: [
            {
                startDate: args.startDate ?? '28daysAgo',
                endDate: args.endDate ?? 'today',
            },
        ],
        dimensions: dimensions.map((name) => ({ name })),
        metrics: metrics.map((name) => ({ name })),
        orderBys: primaryMetric
            ? [{ metric: { metricName: primaryMetric }, desc: true }]
            : undefined,
        limit: String(args.limit ?? '25'),
    };
}

async function runReport(accessToken, propertyId, body) {
    const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const json = await response.json();
    if (!response.ok) {
        throw new Error(`GA4 report request failed: ${JSON.stringify(json)}`);
    }

    return json;
}

function flattenReportRows(report) {
    const dimensionHeaders = report.dimensionHeaders ?? [];
    const metricHeaders = report.metricHeaders ?? [];
    const rows = report.rows ?? [];

    return rows.map((row) => {
        const record = {};

        for (let index = 0; index < dimensionHeaders.length; index += 1) {
            const header = dimensionHeaders[index];
            record[header.name] = row.dimensionValues?.[index]?.value ?? '';
        }

        for (let index = 0; index < metricHeaders.length; index += 1) {
            const header = metricHeaders[index];
            record[header.name] = row.metricValues?.[index]?.value ?? '';
        }

        return record;
    });
}

async function saveLastReport(report) {
    const outputPath = path.join(repoRoot, '.ga4', 'last-report.json');
    await ensureDir(outputPath);
    await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

async function main() {
    const args = parseArgs(process.argv.slice(2));

    if (args.help) {
        printHelp();
        return;
    }

    const propertyId = args.property ?? process.env.GA4_PROPERTY_ID;
    if (!propertyId) {
        throw new Error('Missing GA4 property ID. Pass --property 123456789 or set GA4_PROPERTY_ID.');
    }

    const credentialsPath = path.resolve(repoRoot, args.credentials ?? process.env.GA4_OAUTH_CREDENTIALS ?? defaultCredentialsPath);
    const tokenPath = path.resolve(repoRoot, args.token ?? process.env.GA4_OAUTH_TOKEN ?? defaultTokenPath);

    const client = await loadClientCredentials(credentialsPath);
    const token = await getAccessToken(client, tokenPath, Boolean(args.forceConsent));
    const body = await buildRequestBody(args);
    const report = await runReport(token.access_token, propertyId, body);

    await saveLastReport(report);

    if (args.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
    }

    const rows = flattenReportRows(report);
    if (rows.length === 0) {
        console.log('Report returned no rows.');
        return;
    }

    console.table(rows);
    console.log(`Saved raw response to ${path.relative(repoRoot, path.join(repoRoot, '.ga4', 'last-report.json'))}`);
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
