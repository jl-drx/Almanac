import test from 'node:test';
import assert from 'node:assert/strict';
import {readProgress,saveProgress,STORAGE_KEY,jumpHeight,isDay} from '../dist/content.js';
test('progress rejects corrupted and unknown values and removes duplicates',()=>{
 for(const value of ['broken','null','{}','42'])assert.deepEqual(readProgress({getItem:()=>value}),[]);
 assert.deepEqual(readProgress({getItem:()=>'["moon","bad","moon",null,"earth"]'}),['moon','earth']);
});
test('blocked storage does not stop the expedition',()=>{
 const storage={getItem(){throw Error('blocked')},setItem(){throw Error('quota')}};
 assert.deepEqual(readProgress(storage),[]);assert.equal(saveProgress(storage,['earth']),false);
});
test('discoveries persist under the versioned key',()=>{
 const data=new Map(),storage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)};
 assert.equal(saveProgress(storage,['earth','mars']),true);assert.ok(data.has(STORAGE_KEY));assert.deepEqual(readProgress(storage),['earth','mars']);
});
test('equal take-off speed yields approximately sixfold lunar jump height',()=>{
 const earth=jumpHeight(9.81,4/9.81),moon=jumpHeight(1.62,4/1.62);
 assert.ok(moon/earth>6&&moon/earth<6.1);assert.equal(jumpHeight(9.81,8),0);assert.equal(jumpHeight(1.62,0),0);
});
test('a rotating town moves between day and night',()=>{assert.equal(isDay(0),true);assert.equal(isDay(180),false);assert.equal(isDay(360),true);});
