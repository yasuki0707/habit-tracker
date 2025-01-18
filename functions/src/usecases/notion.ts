import { issueTokenPair, retrieveRefreshToken } from '@/api/fitbit/manageToken';
import {
	createDatabase as createNotionDatabase,
	queryDatabase,
	retrieveDatabase,
} from '@/api/notion/database';
import {
	fetchNotionDatabaseId,
	storeDatabaseId,
} from '@/api/notion/manageDatabaseId';
import { createPage, updatePage } from '@/api/notion/page';
import { fetchData } from '@/usecases/fitbit';
import type { DayjsDate } from '@/util/day';

// env
const NOTION_ACCESS_TOKEN = process.env.NOTION_ACCESS_TOKEN as string;
const NOTION_PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID as string;

export const createDBPage = async (
	day: string,
	newNotionDatabaseId: string | null,
) => {
	const pageIds = await findPageByDay(day);
	if (pageIds.length > 0) {
		console.log(
			`Skip DB page creation, as there's already data for ${day}日 created.`,
		);
		return;
	}

	const previousNotionDatabaseId = await fetchNotionDatabaseId();
	if (!previousNotionDatabaseId) {
		console.error("Couldn't retrieve NOTION Database ID");
		return;
	}
	const notionDatabaseId = newNotionDatabaseId ?? previousNotionDatabaseId;

	const createPageData = {
		parent: {
			database_id: notionDatabaseId,
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
	const { running, sleepDurationInMin, steps } = {
		...(await fetchData(dateForFitbit, accessToken)),
	};
	const day = targetDate.format('D');
	const pageIds = await findPageByDay(day);
	if (pageIds.length === 0) {
		console.error(`Can't update page, as there's no data for ${day}日`);
		return;
	}
	if (pageIds.length > 1) {
		console.error(`Can't update page, as there are multiple data for ${day}日`);
		return;
	}

	const updatePageData = {
		page_id: pageIds[0],
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
	const notionDatabaseId = await fetchNotionDatabaseId();
	if (!notionDatabaseId) {
		console.error("Couldn't retrieve NOTION Database ID");
		return null;
	}
	const retrieveDatabaseParam = {
		database_id: notionDatabaseId,
	};
	const database = await retrieveDatabase(
		retrieveDatabaseParam,
		NOTION_ACCESS_TOKEN,
	);
	if (database === undefined) {
		console.error(`database: ${notionDatabaseId} couldn't be retrieved`);
		return null;
	}

	// FIXME: 以下の項目が意図した通りのコピーされていない
	// - property のアイコン
	// - Progress の formula
	// - property の並び順
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
		// TODO: https://www.pexels.com/search/landscape/ などから適当にカバー画像を取ってきてセットする
		//   "cover": {
		//     "type": "external",
		//     "external": {
		//         "url": "https://www.notion.so/images/page-cover/met_william_morris_1875.jpg"
		//     }
		// },
		cover: database.cover,
		properties: database.properties,
	};
	const newDatabase = await createNotionDatabase(
		createDatabaseParam,
		NOTION_ACCESS_TOKEN,
	);

	// store notion databaseID in firestore
	await storeDatabaseId(newDatabase.id);

	return newDatabase.id;
};

const findPageByDay = async (day: string) => {
	const notionDatabaseId = await fetchNotionDatabaseId();
	if (!notionDatabaseId) {
		console.error("Couldn't retrieve NOTION Database ID");
		return [];
	}
	const filter = {
		database_id: notionDatabaseId,
		filter: {
			property: 'Day',
			title: {
				equals: `${day}日`,
			},
		},
	};

	const pages = await queryDatabase(filter, NOTION_ACCESS_TOKEN);
	return pages.map((p) => p.id);
};
