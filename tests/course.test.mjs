import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {loadCourse} from '../courses/tuilders.js';
import {decryptCourse} from '../crypto.js';
import {spawnSync} from 'node:child_process';

test('104 original slides, source images, restored links and practices remain ordered',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async file=>({ok:true,json:async()=>JSON.parse(await fs.readFile(new URL(`../${file}`,import.meta.url),'utf8'))});
  try {
    const c=await loadCourse();assert.equal(c.pages.length,104);assert.equal(c.activities.length,10);
    assert.deepEqual(c.pages.map(p=>p.n),Array.from({length:104},(_,i)=>i+1));
    for(const p of c.pages){await fs.access(new URL(`../${p.image}`,import.meta.url));for(const link of p.links) assert.match(link.url,/^https:\/\//);}
    const positions=c.activities.map(a=>a.afterPage);assert.deepEqual(positions,[...positions].sort((a,b)=>a-b));
    assert.equal(c.pages[18].links[0].url,'https://gemini.google.com/share/021ec43d944d');
    assert.equal(c.pages[33].links[0].url,'https://gemini.google.com/share/8fee2fe8b6db');
    assert.equal(c.pages[59].links[0].url,'https://aistudio.google.com/');
    assert.equal(c.activities.find(a=>a.id==='c1').afterPage,59);
    for(const a of c.activities){assert.ok(c.pages.some(p=>p.n===a.afterPage));assert.ok(c.chapters.some(p=>p.id===a.chapter));}
  }finally{globalThis.fetch=original;}
});

test('Python encryption interoperates with browser crypto and rejects wrong passwords and tampering',async()=>{
  const script="import importlib.util,json; s=importlib.util.spec_from_file_location('encrypt','tools/encrypt-course.py'); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); print(json.dumps(m.encrypt({'pages':[{'n':1,'title':'private-check'}]},'test-only-strong-password')))";
  const result=spawnSync('python',['-X','utf8','-B','-c',script],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);const envelope=JSON.parse(result.stdout);
  assert.ok(!envelope.data.includes('private-check'));
  assert.deepEqual(await decryptCourse(envelope,'test-only-strong-password'),{pages:[{n:1,title:'private-check'}]});
  await assert.rejects(()=>decryptCourse(envelope,'wrong-password'));
  const bytes=Buffer.from(envelope.data,'base64');bytes[10]^=1;
  await assert.rejects(()=>decryptCourse({...envelope,data:bytes.toString('base64')},'test-only-strong-password'));
});
