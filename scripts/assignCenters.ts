import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyBZcsmaKr8TOQ7Tqwa65z4gh6ZCpdlYhlk",
  authDomain: "kitarcash.firebaseapp.com",
  projectId: "kitarcash",
  storageBucket: "kitarcash.appspot.com",
  messagingSenderId: "929687561236",
  appId: "1:929687561236:web:d85694e588600e866cf301"
};


const app = initializeApp(firebaseConfig);
const fn = httpsCallable(getFunctions(app), 'setUserRole');

async function assign() {
  await fn({ uid: 'uLj7xCgubhVZmmb4tWv9zDLIwV82', role: 'recycling_center', centerId: 'GIpGqMfGlwbPfRDiKTbK' });
  console.log('Center 1 done ✅');

  await fn({ uid: '6yMVcoNvFOVO0NO52HZA4l8OPHi2', role: 'recycling_center', centerId: 'qbdJZV2DWePAoRRFVc0f' });
  console.log('Center 2 done ✅');

  await fn({ uid: '8CZWdx1zjte54qFBoAGommjONg12', role: 'recycling_center', centerId: 'xQe69ftfJByA3XI3ZsPg' });
  console.log('Center 3 done ✅');
}

assign();