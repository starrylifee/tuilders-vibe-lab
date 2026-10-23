import {TABS,CASES} from '../app.js';
const urls=[...new Set([...TABS.flatMap(t=>t.sites.map(x=>x[1])),...CASES.map(x=>x[2])])];
const result=[];
async function worker(){while(urls.length){const url=urls.shift();try{const response=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(15000)});await response.body?.cancel();result.push({url,status:response.status,final:response.url});}catch(error){result.push({url,error:error.cause?.code || error.name});}}}
await Promise.all(Array.from({length:6},worker));
console.log(JSON.stringify({checked:result.length,ok:result.filter(r=>r.status>=200&&r.status<400).length,needsReview:result.filter(r=>!r.status||r.status>=400)},null,2));
