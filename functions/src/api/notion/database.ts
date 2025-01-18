import { Client, isFullDatabase } from '@notionhq/client';
import {
	CreateDatabaseParameters,
	type GetDatabaseParameters,
	type QueryDatabaseParameters,
} from '@notionhq/client/build/src/api-endpoints';
import {
	ClientErrorCode,
	isNotionClientError,
} from '@notionhq/client/build/src/errors';

export const queryDatabase = async (
	filter: QueryDatabaseParameters,
	accessToken: string,
) => {
	const notion = new Client({
		auth: accessToken,
	});

	try {
		const response = await notion.databases.query(filter);
		return response.results;
	} catch (e) {
		if (isNotionClientError(e)) {
			switch (e.code) {
				case ClientErrorCode.RequestTimeout:
				case ClientErrorCode.ResponseError:
					console.error(
						'Error has occurred on client request/response.',
						e.message,
					);
					break;
				default:
					console.error('Error has occurred on server side.', e.message);
					break;
			}
		}
		return [];
	}
};

export const retrieveDatabase = async (
	params: GetDatabaseParameters,
	accessToken: string,
) => {
	const notion = new Client({
		auth: accessToken,
	});

	const response = await notion.databases.retrieve(params);
	if (!isFullDatabase(response)) {
		console.error(`Couldn't retrieve full database.`);
		return;
	}
	return response;
};

// FIXME: 引数型指定でコンパイルエラーは SDK 側の問題っぽい（https://github.com/makenotion/notion-sdk-js/issues/475）ので、解決したら対応
export const createDatabase = async (
	params: any /* CreateDatabaseParameters*/,
	accessToken: string,
) => {
	const notion = new Client({
		auth: accessToken,
	});

	const response = await notion.databases.create(params);
	return response;
};
