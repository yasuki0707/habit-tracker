import { getNested } from '@/util/obj';
import { Client } from '@notionhq/client';
import type {
	CreatePageParameters,
	UpdatePageParameters,
} from '@notionhq/client/build/src/api-endpoints';
import {
	APIErrorCode,
	ClientErrorCode,
	isNotionClientError,
} from '@notionhq/client/build/src/errors';

export const createPage = async (
	params: CreatePageParameters,
	accessToken: string,
) => {
	const notion = new Client({
		auth: accessToken,
	});

	try {
		const response = await notion.pages.create(params);

		const progress = getNested(
			response,
			'properties',
			'Progress',
			'formula',
			'number',
		);
		if (progress === undefined) {
			console.error("Total Progress couldn't be retrieved.");
		}

		return progress >= 1;
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
		return false;
	}
};

export const updatePage = async (
	params: UpdatePageParameters,
	accessToken: string,
) => {
	const notion = new Client({
		auth: accessToken,
	});

	try {
		const response = await notion.pages.update(params);

		const progress = getNested(
			response,
			'properties',
			'Progress',
			'formula',
			'number',
		);

		// Normal when progress=0.0
		if (progress > 0 && !progress) {
			console.error("Total Progress couldn't be retrieved.");
		}

		return progress >= 1;
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
		return false;
	}
};
