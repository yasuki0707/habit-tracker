import './fix-ts-paths';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';
import { DayjsDate } from '@/util/day';
import { retrieveRefreshToken, issueTokenPair, storeRefreshToken } from '@/fitbit/manageToken';

import { fetchSleepData } from '@/fitbit/sleep';

// Pub/Sub Topic名
const PUBSUB_TOPIC_NAME = 'habit-tracker-pubsub-topic';

const { onMessagePublished } = require('firebase-functions/v2/pubsub');

const firebase = initializeApp();

exports.habitTrackerPubsub = onMessagePublished(PUBSUB_TOPIC_NAME, async (event: any) => {
  // Pub/sub メッセージが来た時点の日付の前日をとる
  const targetDate = new DayjsDate().jt().dayBefore(1);
  console.log('targetDate:', targetDate);

  const dateForFitbit = targetDate.format('YYYY-MM-DD');
  console.log('dateForFitbit:', dateForFitbit);

  // TODO: retrieve refresh_token
  const oldRefreshToken = await retrieveRefreshToken();

  const accessToken = await issueTokenPair(oldRefreshToken);
  console.log('accessToken:', accessToken);

  const sleep = await fetchSleepData(dateForFitbit, accessToken);
  console.log('sleep:', sleep);
});
