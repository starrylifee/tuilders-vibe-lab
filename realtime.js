import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore,doc,onSnapshot,setDoc,serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const app=initializeApp({apiKey:'AIzaSyDS0TtlZDHDDZFPSiBN0KP5Ie4Erjk_ijI',authDomain:'tuilders-vibe-lab-2026.firebaseapp.com',projectId:'tuilders-vibe-lab-2026',storageBucket:'tuilders-vibe-lab-2026.firebasestorage.app',messagingSenderId:'722668167448',appId:'1:722668167448:web:f2650818e0803d2a187e6d'});
const hashes=['b26a4d53e65ad4d6bc943a406a7a4dad06afc8bc71e99d24179256ba39e03bf2','7b360e5e3e2011124fb6ef2c6f2324d8d9d36de308d47232a9421b7beeeadd3a'];
async function allowed(user){if(!user?.email || !user.emailVerified)return false;const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(user.email.toLowerCase()));return hashes.includes([...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join(''));}
export function createRealtime(handlers){
  const db=getFirestore(app),auth=getAuth(app);let ref=null,unsubscribe,teacher=false,generation=0;
  onAuthStateChanged(auth,async user=>{teacher=await allowed(user);handlers.onAuth(teacher);});
  return {
    watch(id){unsubscribe?.();generation++;ref=null;if(!id)return;const token=generation;ref=doc(db,'live',id);let first=true;unsubscribe=onSnapshot(ref,{includeMetadataChanges:true},snap=>{if(token!==generation)return;handlers.onConnection(!snap.metadata.fromCache);if(snap.metadata.hasPendingWrites || snap.metadata.fromCache)return;handlers.onState(snap.exists()?snap.data():{},first);first=false;},()=>{if(token===generation)handlers.onConnection(false);});},
    async publish(data){if(!ref || !teacher)throw new Error('강사 로그인이 필요합니다.');await setDoc(ref,{...data,updatedAt:serverTimestamp()},{merge:true});},
    async login(){const {user}=await signInWithPopup(auth,new GoogleAuthProvider());if(!await allowed(user)){await signOut(auth);throw new Error('등록된 강사 계정으로 로그인해 주세요.');}},
    async logout(){await signOut(auth);}
  };
}
