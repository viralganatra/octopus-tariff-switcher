<div align="center">
<h1>Octopus Tariff Switcher 🐙</h1>

<p>Automatically switch to the cheapest smart tariff based on your electricity usage.</p>
</div>

<hr />

## What is this?

**Octopus Tariff Switcher** analyses your daily electricity usage and compares your current Octopus Smart tariff against other available tariffs. If it finds a cheaper option, it automatically initiates a switch for you.

Because Octopus Energy recalculates the entire day's costs when you switch (even late in the day), **tariff hopping** can help reduce your bills by maximising savings daily.

You can also optionally **backfill historical usage data** to enhance comparisons — details below.

## 🚀 How to use

### ✅ Requirements

* An [Octopus Energy](https://octopus.energy) account with an [api key](https://octopus.energy/dashboard/new/accounts/personal-details/api-access)
* A smart meter reporting 30-minute interval data
* A supported Octopus Smart Tariff (see below)
* An [Octopus Home Mini]((https://octopus.energy/blog/octopus-home-mini/)) (for real-time usage data — required)
* An [AWS account](https://aws.amazon.com/)

### 🛠 Tech stack

* [sst.dev](https://www.sst.dev/) - For deploying infrastructure
* [TypeScript](https://www.typescriptlang.org/) - Language of choice
* [pnpm](https://pnpm.io/) - Package manager for node.js

### 🔧 Services

* [SparkPost](https://app.eu.sparkpost.com/join) - For sending emails
* [mjml](https://mjml.io/) - For generating email templates

### ⚙️ Setup

1. [Set up your AWS account](https://sst.dev/docs/aws-accounts)
2. [Configure IAM credentials](https://sst.dev/docs/iam-credentials) for deploying the app
3. [Create your SparkPost API Key](https://support.sparkpost.com/docs/getting-started/create-api-keys) and setup your email sending domain
4. [Signup for mjml](https://mjml.io/api)

### 🏗 Build & Deploy

```
pnpm install # Install dependencies
```

1. Create AWS profiles for development and production (e.g. `octopus-dev`, `octopus-production`)

**Note** If you've used different profile names, edit `sst.config.ts` and `scripts/export-sso-creds.sh`.

2. Create your secrets

```
sst secret set AccNumber {accNumber} # Your Octopus account number
sst secret set ApiKey {apiKey} # Your Octopus API Key
sst secret set ApiKey {SparkPostApiKey} # Your spark post API key
sst secret set ApiKey {EmailFrom} # The email address sender
sst secret set ApiKey {MjmlAppId} # The app id from mjml
sst secret set ApiKey {MjmlSecretKey} # The secret key from mjml
```

3. Deploy to your dev environment:

```
pnpm deploy:dev
```

4. [Test locally](docs/testing-locally.md) using one of the deployed Lambda functions

## ⚡️ Supported Tariffs

* [Agile Octopus](https://octopus.energy/smart/agile/)
* [Cosy Octopus](https://octopus.energy/smart/cosy-octopus/)
* [Octopus Go](https://octopus.energy/smart/go/)

## 🛠 How it works

The project deploys **4 distinct processes**:

1️⃣ Tariff Switcher

A Lambda function:

* Fetches your daily usage and current tariff costs
* Retrieves unit rates for other tariffs
* Compares all tariffs to find the cheapest
* Runs **daily at 22:45 UTC** (planned to localise to Europe/London once supported by SST)

📂 Main entrypoint: `./src/tariff-switcher`

<hr />

2️⃣ Backfill historical data

Manually backfill historical data using the API Gateway:

```
GET /backfill?backfillFromDate=YYYY-MM-DD
```

Example:

```
https://qqdi7mvnmz.execute-api.eu-west-2.amazonaws.com/backfill?backfillFromDate=2025-01-01
```

* Fetches historical usage from Octopus API
* Publishes messages to an SQS queue
* A Lambda consumer reads and inserts data into DynamoDB

You can also specify an **end date**:

```
https://qqdi7mvnme.execute-api.eu-west-2.amazonaws.com/backfill?backfillFromDate=2025-01-01&backfillToDate=2025-04-31
```

📂 Main entrypoints:
`./src/publish-historical-tariff-data`
`./src/tariff-data-processor`

<hr />

3️⃣ Backfill yesterday’s data

A **daily cron job at 22:00 UTC** automatically backfills yesterday’s usage data.

📂 Main entrypoint: `./src/publish-yesterdays-tariff`

## Inspired by

https://github.com/eelmafia/octopus-minmax

## License

[MIT](LICENSE)
