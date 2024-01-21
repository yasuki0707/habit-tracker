import { createPage, updatePage } from '@/api/notion/page';
import { retrieveDatabase, queryDatabase, createDatabase as createNotionDatabase } from '@/api/notion/database';
import { DayjsDate } from '@/util/day';
import { retrieveRefreshToken, issueTokenPair } from '@/api/manageToken';
import { fetchData } from '@/usecases/fitbit';

// env
const NOTION_ACCESS_TOKEN = process.env.NOTION_ACCESS_TOKEN as string;
// FIXME: Since NOTION_DATABASE_ID is dynamic variable, will change by month. It should be held on firestore.
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID as string;
const NOTION_PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID as string;

export const createDBPage = async (day: string) => {
  const createPageData = {
    parent: {
      database_id: NOTION_DATABASE_ID,
    },
    properties: {
      Day: {
        title: [
          {
            text: {
              content: `${day}日`,
            },
          },
        ],
      },
    },
  };
  const completed = await createPage(createPageData, NOTION_ACCESS_TOKEN);
};

export const updateDBPage = async (targetDate: DayjsDate) => {
  // filter pages in database that matches "`day`日" for property 'Day'.
  const dateForFitbit = targetDate.format('YYYY-MM-DD');
  const oldRefreshToken = await retrieveRefreshToken();
  if (!oldRefreshToken) {
    console.error("Couldn't retrieve refresh token");
    return;
  }
  const accessToken = await issueTokenPair(oldRefreshToken);
  if (!accessToken) {
    console.error('Access token is not valid');
    return;
  }
  const { running, sleepDurationInMin, steps } = { ...(await fetchData(dateForFitbit, accessToken)) };
  const pageId = await findPageByDay(targetDate.format('DD'));
  if (!pageId) {
    console.error('page not found');
    return;
  }

  const updatePageData = {
    page_id: pageId,
    properties: {
      RunningTime: {
        number: running.durationInMin, // from Fitbit activity? NRC?
      },
      SleepDuration: {
        number: sleepDurationInMin,
      },
      Steps: {
        number: steps,
      },
    },
  };

  const completed = await updatePage(updatePageData, NOTION_ACCESS_TOKEN);
  if (completed) {
    // TODO: LINE 通知などをする
  }
};

export const createDatabase = async (yyyymm: string) => {
  const retrieveDatabaseParam = {
    database_id: NOTION_DATABASE_ID,
  };
  const database = await retrieveDatabase(retrieveDatabaseParam, NOTION_ACCESS_TOKEN);
  if (database === undefined) {
    console.error(`database: ${NOTION_DATABASE_ID} couldn't be retrieved`);
    return;
  }
  console.log('database:', database);

  const createDatabaseParam = {
    parent: database.parent,
    title: [
      {
        type: 'text',
        text: {
          content: yyyymm,
          // link: null,
        },
        // annotations: {
        //   bold: false,
        //   italic: false,
        //   strikethrough: false,
        //   underline: false,
        //   code: false,
        //   color: 'default',
        // },
        plain_text: yyyymm,
        // href: null,
      },
    ],
    properties: database.properties,
  };
  const newDatabase = await createNotionDatabase(createDatabaseParam, NOTION_ACCESS_TOKEN);
  // TODO: store database_id to firestore
};

const findPageByDay = async (day: string) => {
  const filter = {
    database_id: NOTION_DATABASE_ID,
    filter: {
      property: 'Day',
      title: {
        equals: `${day}日`,
      },
    },
  };

  const pages = await queryDatabase(filter, NOTION_ACCESS_TOKEN);
  if (pages.length === 0) {
    console.error(`There's no data for ${day}日`);
    return;
  }
  if (pages.length > 1) {
    console.error(`There's multiple data for ${day}日`);
    return;
  }
  return pages[0].id;
};