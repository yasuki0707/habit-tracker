# Health Tracker

This repository is intended to be used to setup a pipeline for Fitbit activity data to be written on Notion database.
To setup the pipeline, you need to follow the below procedures from [Installation](#installation), [Prerequisites](#prerequisites), [Config](#config) and [Build and Deploy](#build-and-deploy).

## Installation

```sh
# clone repository
git clone git@github.com:yasuki0707/habit-tracker.git

# install packages
npm i
```

## Prerequisites

### Fitbit

_You need to store activity data with a device such as a wearable device or a smartphone that is compatible with Fitbit._

1. Create developer account [here](https://accounts.fitbit.com/signup).
2. Register a new application [here](https://dev.fitbit.com/apps/new).
   - Among the input items, URLs may be OK anything like `http://localhost:8080/`
3. After registration make sure `OAuth 2.0 Client ID` and `Client Secret` are created in **MANAGE MY APPS** page.
4. Get refresh token by following this [procedure](https://dev.fitbit.com/build/reference/web-api/troubleshooting-guide/oauth2-tutorial/). In step 4 you can get `refresh_token`, which will be used later.

### Notion

1. Create a new page.
   - page id(path parameter that follows the part `https://www.notion.so/`) will be used later.
2. Create a new database under the page.
   - database id(path parameter that follows the part `https://www.notion.so/`) will be used later.
3. Add properties:
   - `Day`: day of the mouth
     - type: Title
   - `RunningTime`: running time in minutes in the day
     - type: Number
   - `SleepDuration`: sleep time in minutes over the night
     - type: Number
   - `Steps`: number of steps in the day
     - type: Number
4. Get Secret
   1. Create a new integration(e.g. `my-integration`)
      1. `Secrets` will be used later.
   2. On the page which is target for writing records, select **Add connections > _my-integration_**.

## Config

### env

For this project to work, `.env` should be setup.

1. Create `.env` file

```sh
touch .env
```

2. Set environment variables

```sh
COLLECTION_PATH=
FITBIT_DOC_ID=
NOTION_DOC_ID=
CLIENT_ID=
CLIENT_SECRET=
NOTION_ACCESS_TOKEN=
NOTION_PARENT_PAGE_ID=
PUBSUB_TOPIC_NAME=
```

where:

- `COLLECTION_PATH`: Firestore root collection name to store information such as token, ids
- `FITBIT_DOC_ID`: Firestore document name to store information related to fitbit
- `NOTION_DOC_ID`: Firestore document name to store information related to Notion
- `CLIENT_ID`: Fitbit OAuth 2.0 Client ID retrieved in step 3 [here](#Fitbit).
- `CLIENT_SECRET`: Fitbit client secret retrieved in step 3 [here](#Fitbit).
- `NOTION_ACCESS_TOKEN`: Notion API access token(secrets) retrieved in step 4 [here](#Notion).
- `NOTION_PARENT_PAGE_ID`: Page ID of Notion page, child of which is database page. This is normally 32 length characters consisting of alphabet and digit, so make it like UUID-style by inserting `-` at proper position.
- `PUBSUB_TOPIC_NAME`: Pub/sub topic name

### GCP/Firebase

#### Firestore

- Create collection and document like below:

```sh
COLLECTION_PATH # root collection
├── FITBIT_DOC_ID # document
│   └── refreshToken: <xxxxxxxxxxx...>
└── NOTION_DOC_ID # document
    └── databaseId: <xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx>
```

where:

- Root collection/document name are defined [here](#env).
- `refreshToken` is retrieved in step 4 [here](#Fitbit).
  - This is only required the first time, as will be automatically managed afterwards.
- `databaseId` is retrieved in step 2 [here](#Notion).
  - This is only required the first time, as will be automatically managed afterwards.

#### Cloud Scheduler

Set as you like(e.g. `10 0 * * *`).

## Build and Deploy

To deploy functions, Firebase CLI tool is needed.

```sh
npm install -g firebase-tools
```

There are several things to be done on local machine, like configuring target project. Please refer to the [official documentation](https://firebase.google.com/docs/functions/get-started?gen=2nd) for more details.

To deploy the functions, run:

```sh
npm run deploy
# this triggers build process first then if succeeded deploy will begin.
```
