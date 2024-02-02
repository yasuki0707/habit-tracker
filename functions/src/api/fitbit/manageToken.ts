import { firestore } from 'firebase-admin';

const FIRESTORE_COLLECTION_PATH = process.env.COLLECTION_PATH || '';
const FIRESTORE_DOC_ID = process.env.DOC_ID || '';
const CLIENT_ID = process.env.CLIENT_ID || '';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';

export const retrieveRefreshToken = async () => {
  // TODO:try-catch or else
  const collection = await firestore().collection(`${FIRESTORE_COLLECTION_PATH}`); // .doc(docId).set(t);

  const data = (await collection.doc(FIRESTORE_DOC_ID).get()).data();
  if (!data) {
    // TODO: handle error
    return null;
  }
  const refreshToken = data['refreshToken'];
  if (!refreshToken) {
    // TODO: handle error
    return null;
  }
  return refreshToken as string;
};

export const issueTokenPair = async (refreshToken: string) => {
  // TODO:try-catch
  const url = `https://api.fitbit.com/oauth2/token?grant_type=refresh_token&refresh_token=${refreshToken}`;
  const basicToken = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  const data = await response.json();

  // NOTE: failed の時のみ success = false が返ってくる
  if ('success' in data && !data.success) {
    // TODO: handle error
    console.error('Failed to fetch refresh token from firestore');
    console.log(data.errors[0].message);
    return null;
  }
  const newAccessToken = data['access_token'];
  const newRefreshToken = data['refresh_token'];
  if (!newAccessToken || !newRefreshToken) {
    console.error(`newAccessToken: ${newAccessToken}, newRefreshToken: ${newRefreshToken}`);
    return null;
  }
  storeRefreshToken(newRefreshToken);

  return newAccessToken as string;
};

export const storeRefreshToken = async (newRefreshToken: string) => {
  // TODO:try-catch or else
  await firestore()
    .collection(`${FIRESTORE_COLLECTION_PATH}`)
    .doc(FIRESTORE_DOC_ID)
    .set({ refreshToken: newRefreshToken });
};
