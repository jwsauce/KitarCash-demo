import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  // api keys here yaaaa :)
};


const app = initializeApp(firebaseConfig);
const fn = httpsCallable(getFunctions(app), 'setUserRole');

async function assign() {
  // for assigning role as recycling_center
  await fn({ uid: '// user uid here' , role: 'recycling_center', centerId: 'GIpGqMfGlwbPfRDiKTbK' });
  console.log('Center done ✅');

  // for assigning role as driver
  await fn({ uid: '// user uid here', role: 'driver'});
  console.log('Driver done ✅');
}

assign();
