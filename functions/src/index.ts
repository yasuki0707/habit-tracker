import './fix-ts-paths';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';
import { DayjsDate } from '@/util/day';
import { retrieveRefreshToken, issueTokenPair, storeRefreshToken } from '@/fitbit/api/manageToken';

import { fetchData } from '@/fitbit/usecases';
import { updateDBPage, createDBPage, createDatabase } from '@/notion/usecases';

// Pub/Sub Topic名
const PUBSUB_TOPIC_NAME = 'habit-tracker-pubsub-topic';

const { onMessagePublished } = require('firebase-functions/v2/pubsub');

const firebase = initializeApp();

exports.habitTrackerPubsub = onMessagePublished(PUBSUB_TOPIC_NAME, async (event: any) => {
  // Pub/sub メッセージが来た時点の日付の前日をとる
  const today = new DayjsDate().jt();
  const targetDate = today.dayBefore(1);
  // console.log('targetDate:', targetDate);

  // TODO: This should be inside updateDBPage-----------------------------------------------------------
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
  // TODO: This should be inside updateDBPage-----------------------------------------------------------

  // FIXME: Create request should be executed separately from update request, therefore it's better to prepare for another job and topic by which create request is called in another timing.
  // Or create database(pages for a whole month) at 1st day of each month in the same request.
  // NOTE: Another consideration: Create new month database by duplicating previous database.
  // For duplication retrieve database at first and create database from obj retrieved.

  // today                              today                 targetDate
  // 2024/1/30 AM 0:05 =>               create page for 1/30, update page for 1/29
  // 2024/1/31 AM 0:05 =>               create page for 1/31, update page for 1/30
  // 2024/2/1 AM 0:05 => **create DB**, create page for 2/1, update page for 1/31
  // 2024/2/2 AM 0:05 =>                create page for 2/2, update page for 2/1
  if (today.format('DD') === '01') {
    await createDatabase(today.format('YYYY/MM'));
  }
  await createDBPage(today.format('DD'));
  await updateDBPage(targetDate.format('DD'), running.durationInMin, sleepDurationInMin, steps);
});
