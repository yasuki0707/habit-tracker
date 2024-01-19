import { Client } from '@notionhq/client';
import {
  CreatePageParameters,
  UpdatePageParameters,
  QueryDatabaseParameters,
} from '@notionhq/client/build/src/api-endpoints';
import { APIErrorCode, ClientErrorCode, isNotionClientError } from '@notionhq/client/build/src/errors';
import { getNested } from '@/util/obj';

export const queryDatabase = async (filter: QueryDatabaseParameters, accessToken: string) => {
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
          console.error('Error has occurred on client request/response.', e.message);
          break;
        default:
          console.error('Error has occurred on server side.', e.message);
          break;
      }
    }
    return [];
  }
};

export const updatePage = async (params: UpdatePageParameters, accessToken: string) => {
  const notion = new Client({
    auth: accessToken,
  });

  // TODO: page_id をどうやって取ってくるか？
  // 1. キー(Day?)でgetして page_id を抽出？
  // 2. create した時のを firestore に保存しておく→ 月初に全部createするパターンだと厳しい
  try {
    const response = await notion.pages.update(params);

    const progress = getNested(response, 'properties', 'Progress', 'formula', 'number');

    return progress >= 1;
  } catch (e) {
    if (isNotionClientError(e)) {
      switch (e.code) {
        case ClientErrorCode.RequestTimeout:
        case ClientErrorCode.ResponseError:
          console.error('Error has occurred on client request/response.', e.message);
          break;
        default:
          console.error('Error has occurred on server side.', e.message);
          break;
      }
    }
    return false;
  }
};
