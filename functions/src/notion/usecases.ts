import { createPage, updatePage } from '@/notion/api/page';
import { queryDatabase } from '@/notion/api/database';

// env
const NOTION_ACCESS_TOKEN = process.env.NOTION_ACCESS_TOKEN as string;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID as string;

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

export const updateDBPage = async (
  day: string,
  runningDurationInMin: number,
  sleepDurationInMin: number,
  steps: number,
) => {
  // filter pages in database that matches "`day`日" for property 'Day'.
  const pageId = await findPageByDay(day);
  if (!pageId) {
    console.error('page not found');
    return;
  }

  const updatePageData = {
    page_id: pageId,
    properties: {
      RunningTime: {
        number: runningDurationInMin, // from Fitbit activity? NRC?
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
