import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanMapAddress,roomMapAddress,roomMapLinks} from '../src/services/maps.js';

test('room address always takes precedence over stale or otherwise valid coordinates',()=>{
 for(const coordinates of [[105.8342,21.0278],[106.7,10.8],[0,0],[999,100],['105','21']]){
  const map=roomMapLinks({address:'55 Trần Phú, Hà Đông, Hà Nội',location:{coordinates}});
  assert.equal(map.query,'55 Trần Phú, Hà Đông, Hà Nội, Việt Nam');
  assert.equal(new URL(map.directions).searchParams.get('destination'),map.query);
  assert.equal(new URL(map.embed).searchParams.get('q'),map.query);
  assert.equal(map.source,'address');
 }
});
test('address lookup opens Google Maps for both iframe and external links',()=>{
 const map=roomMapLinks({address:'Ngõ 3 & 5, Đống Đa'});
 for(const key of ['embed','search','directions'])assert.equal(new URL(map[key]).hostname,'www.google.com');
 assert.equal(new URL(map.search).searchParams.get('api'),'1');
 assert.equal(new URL(map.directions).searchParams.get('api'),'1');
 assert.equal(new URL(map.embed).searchParams.get('output'),'embed');
 assert.equal(new URL(map.embed).searchParams.get('q'),'Ngõ 3 & 5, Đống Đa, Hà Nội, Việt Nam');
});
test('search adds the current Hanoi locality for incomplete imported addresses',()=>{
 assert.equal(roomMapAddress({address:'Ngõ 269 Phú Diễn'}),'Ngõ 269 Phú Diễn, Hà Nội, Việt Nam');
 assert.equal(roomMapAddress({address:'Ngõ 207 Xuân Đỉnh, ngách 84, số nhà 7'}),'Ngõ 207 Xuân Đỉnh, ngách 84, số nhà 7, Hà Nội, Việt Nam');
});
test('explicit city or province is preserved instead of assuming Hanoi',()=>{
 for(const city of ['Đà Nẵng','Hồ Chí Minh','Khánh Hòa','TP. HCM']){
  const address='12 Nguyễn Văn Linh, '+city;
  assert.equal(roomMapAddress({address}),address+', Việt Nam');
 }
 assert.equal(roomMapAddress({address:'12 Hải Phòng',city:'Đà Nẵng'}),'12 Hải Phòng, Đà Nẵng, Việt Nam');
});
test('district is added once with case- and accent-insensitive matching',()=>{
 assert.equal(roomMapAddress({address:'Chùa Láng, Đống Đa',district:'dong da'}),'Chùa Láng, Đống Đa, Hà Nội, Việt Nam');
 assert.equal(roomMapAddress({address:'Chùa Láng',district:'Đống Đa'}),'Chùa Láng, Đống Đa, Hà Nội, Việt Nam');
});
test('clean listing copy without removing building names or lane numbers',()=>{
 assert.equal(cleanMapAddress('CHO THUÊ NHÀ NGUYÊN CĂN mặt ngõ 68 triều khúc (ngõ ô tô )'),'ngõ 68 triều khúc');
 assert.equal(cleanMapAddress('28 An Hoà, Mỗ Lao, Hà Đông - Hà Nội (ô tô đỗ cửa nhà mặt phố)'),'28 An Hoà, Mỗ Lao, Hà Đông, Hà Nội');
 assert.equal(cleanMapAddress('SN 14A ngách 322/95/14 Mỹ Đình'),'Số nhà 14A ngách 322/95/14 Mỹ Đình');
 assert.equal(cleanMapAddress('12A (Tòa B), HN'),'12A (Tòa B), Hà Nội');
});
test('country is not duplicated and a typed query is used consistently',()=>{
 assert.equal(roomMapAddress({address:'55 Trần Phú, Hà Nội, Việt Nam'}),'55 Trần Phú, Hà Nội, Việt Nam');
 const map=roomMapLinks({address:'Old address'},{query:'  12 Chùa Láng, Hà Nội  '});
 assert.equal(map.query,'12 Chùa Láng, Hà Nội');
 assert.equal(new URL(map.directions).searchParams.get('destination'),map.query);
 assert.equal(new URL(map.search).searchParams.get('query'),map.query);
});
test('malformed/missing addresses never produce a made-up pin or a coordinate fallback',()=>{
 for(const room of [null,{}, {address:42}, {address:'  '}, {location:{coordinates:[106.7,10.8]}}])assert.equal(roomMapLinks(room),null);
 assert.equal(roomMapLinks({address:'X'},{query:'   '}),null);
 assert.equal(roomMapAddress({district:'Cầu Giấy'}),'Cầu Giấy, Hà Nội, Việt Nam');
});
