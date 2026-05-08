# GA4 OAuth setup

This repo now includes a local GA4 reader script:

```bash
node tools/ga4-report.mjs --property 503084872
```

It uses your own Google account through OAuth and stores the token locally under `.ga4/`, which is ignored by Git.

## 1. Enable the API

In the Google Cloud project you already opened (`image4ai`):

1. Open `API 和服务` -> `已启用的 API 和服务`.
2. Click `启用 API 和服务`.
3. Search for `Google Analytics Data API`.
4. Enable it.

## 2. Create the OAuth client

Google moved this flow into `Google Auth Platform`.

1. Open `Google Auth Platform`.
2. If prompted, finish the minimal app setup first:
   - Branding / app name: any internal name is fine, for example `balatrocalc local`
   - User support email: your own email
   - Audience: `External`
   - Publishing status: keep it in `Testing`
   - Test users: add your own Google account if Google asks for it
3. Open `Clients`.
4. Click `Create client`.
5. Application type: `Desktop app`.
6. Name it something like `balatrocalc local desktop`.
7. Create it and download the JSON immediately.

Google's current help center notes that some client secrets are only shown or downloadable at creation time, so keep the JSON file you download.

Save that file as:

```bash
.ga4/oauth-client.json
```

## 3. Run the first report

If your GA URL looks like this:

```text
https://analytics.google.com/analytics/web/#/a308347408p503084872/admin
```

then the property ID is likely:

```text
503084872
```

Run:

```bash
node tools/ga4-report.mjs --property 503084872
```

The script will:

1. open a browser tab,
2. ask you to log in and approve `analytics.readonly`,
3. save the refresh token to `.ga4/oauth-token.json`,
4. fetch a default top-pages report.

## 4. Useful examples

Top pages in the last 28 days:

```bash
node tools/ga4-report.mjs \
  --property 503084872 \
  --dimensions pagePath,pageTitle \
  --metrics screenPageViews,activeUsers,sessions
```

Top landing pages in the last 7 days:

```bash
node tools/ga4-report.mjs \
  --property 503084872 \
  --start-date 7daysAgo \
  --dimensions landingPagePlusQueryString \
  --metrics sessions,activeUsers,newUsers
```

Raw JSON:

```bash
node tools/ga4-report.mjs --property 503084872 --json
```

Use a custom request body:

```bash
node tools/ga4-report.mjs --property 503084872 --body path/to/report.json
```

## 5. Common errors

`access_denied`

- The OAuth consent screen is still in testing and your Google account is not added as a test user.

`redirect_uri_mismatch`

- Recreate the client as `Desktop app`. Do not use a Web client here.

`insufficientPermissions`

- The Google account that completed OAuth does not have access to this GA4 property.

`API has not been used in project`

- The `Google Analytics Data API` is not enabled in the same Google Cloud project as the OAuth client.
