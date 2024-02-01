import './fix-ts-paths';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';
import { DayjsDate } from '@/util/day';
import { updateDBPage, createDBPage, createDatabase } from '@/usecases/notion';
import { defineString } from 'firebase-functions/params';

// Pub/Sub Topic名
const { onMessagePublished } = require('firebase-functions/v2/pubsub');

const PUBSUB_TOPIC_NAME = defineString('PUBSUB_TOPIC_NAME');

const firebase = initializeApp();

// - e.g. habitTrackerPubsub({data: Buffer.from('{"targetDate":"2024/1/29"}')})
// - ref: https://firebase.google.com/docs/functions/local-shell#invoke_pubsub_functions
exports.habitTrackerPubsub = onMessagePublished({ topic: PUBSUB_TOPIC_NAME }, async (event: any) => {
  // Pub/sub メッセージが来た時点の日付の前日をとる
  const targetDate = determineTargetDate(event.time, event.data.message.data?.data);

  // FIXME: Create request should be executed separately from update request, therefore it's better to prepare for another job and topic by which create request is called in another timing.
  // Or create database(pages for a whole month) at 1st day of each month in the same request.
  // NOTE: Another consideration: Create new month database by duplicating previous database.
  // For duplication retrieve database at first and create database from obj retrieved.

  // targetDate                         targetDate            targetDate - 1
  // 2024/1/30 AM 0:05 =>               create page for 1/30, update page for 1/29
  // 2024/1/31 AM 0:05 =>               create page for 1/31, update page for 1/30
  // 2024/2/1 AM 0:05 => **create DB**, create page for 2/1, update page for 1/31
  // 2024/2/2 AM 0:05 =>                create page for 2/2, update page for 2/1

  // const notionDatabaseId = 'xxxxx'; // TODO: fetch from firestore
  await updateDBPage(targetDate.dayBefore(1));

  let newNotionDatabaseId = '';
  if (targetDate.format('DD') === '01') {
    // TODO: 作成した DB の ID を一時的に保存
    newNotionDatabaseId = await createDatabase(targetDate.format('YYYY/MM'));
  }
  // TODO: このタイミングで NOTION_DATABASE_ID の切り替えを行う。
  await createDBPage(targetDate.format('DD'), newNotionDatabaseId);
});

const determineTargetDate = (eventTime: string, buf: any) => {
  // firebase functions:shell によるテストで任意の日付を与えて動作を確認するため、ここで日付を決定する
  // データ書き込み対象日について、pub/sub message にテスト用日付データがある場合は、そちらを優先する
  if (!buf) {
    return new DayjsDate(eventTime).jt();
  }
  const targetDateStr = String.fromCharCode.apply(null, [...new Uint16Array(buf)]);
  const targetDate = JSON.parse(targetDateStr).targetDate;
  if (!targetDate) {
    return new DayjsDate(eventTime).jt();
  }
  return new DayjsDate(targetDate);
};
