import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {parsePriceValue,parseZaloText} from '../src/lib/zaloParser.js';
import {resolveRoomUpdate} from '../src/lib/roomFinancials.js';

// Controllers run unchanged in a module sandbox. DB, uploads, mail and sockets
// are isolated so the regression suite cannot write to a real service.
const require=createRequire(process.env.ADMIN_TEST_DEPENDENCIES || new URL('../package.json',import.meta.url));
const mongoose=require('mongoose'),xlsx=require('xlsx'),bcrypt=require('bcrypt');
const cache=new Map();
const emitted=[];
function synthetic(key,exports){
 if(!cache.has(key))cache.set(key,new vm.SyntheticModule(Object.keys(exports),function(){for(const [k,v] of Object.entries(exports))this.setExport(k,v)}));
 return cache.get(key);
}
async function load(url){
 if(cache.has(url))return cache.get(url);
 const source=await readFile(fileURLToPath(url),'utf8');
 const module=new vm.SourceTextModule(source,{identifier:url,importModuleDynamically:async(spec,ref)=>{const m=await link(spec,ref);if(m.status==='linked')await m.evaluate();return m;}});
 cache.set(url,module);await module.link(link);return module;
}
async function link(spec,ref){
 if(spec==='mongoose')return synthetic('mongoose',{default:mongoose});
 if(spec==='xlsx')return synthetic('xlsx',{default:xlsx});
 if(spec==='bcrypt')return synthetic('bcrypt',{default:bcrypt});
 if(spec==='https')return synthetic('https',{default:require('https')});
 if(spec.endsWith('/server.js'))return synthetic('socket',{io:{emit:(...args)=>emitted.push(args)}});
 if(spec.endsWith('/cloudinary.js'))return synthetic('uploads',{uploadImage:()=>{throw Error('Unexpected upload')},uploadVideo:()=>{throw Error('Unexpected upload')}});
 if(spec.endsWith('/generateToken.js'))return synthetic('token',{default:()=> 'test-token'});
 if(spec.endsWith('/emailService.js'))return synthetic('email',{sendPasswordResetEmail:()=>{throw Error('Unexpected email')}});
 return load(new URL(spec,ref.identifier).href);
}
async function imported(path){const m=await load(new URL(path,import.meta.url).href);if(m.status==='linked')await m.evaluate();return m.namespace;}
const {default:Room}=await imported('../src/modules/Room.js');
const {default:User}=await imported('../src/modules/User.js');
const roomController=await imported('../src/controllers/room.controller.js');
const authController=await imported('../src/controllers/auth.controller.js');
const base={price:3500000,commissionRate:50,cashbackAmount:315000,totalCommission:1750000,ownerInfo:{name:'Chủ nhà',phone:'0900000000'}};
function response(){return {statusCode:200,status(n){this.statusCode=n;return this},json(data){this.data=data;return this}};}
const fixtures=[['number',3500000,3500000],['decimal comma','3,5tr',3500000],['decimal dot','3.5tr',3500000],['compact','3tr5',3500000],['compact digits','3tr50',3500000],['trieu','3,5 triệu',3500000],['dot grouping','3.500.000',3500000],['comma grouping','3,500,000 VND',3500000],['thousands','500k',500000],['zero',0,0]];
for(const [name,input,expected]of fixtures)test('price '+name,()=>assert.equal(parsePriceValue(input),expected));
test('invalid or negative prices never become positive amounts',()=>{for(const input of [-1,Infinity,NaN,true,null,'','abc','-3tr','3tr5xyz','3.5tr5','3.50.000'])assert.ok(Number.isNaN(parsePriceValue(input)),String(input));});
test('manual amounts including zero take precedence even when price is present',()=>{
 const data=resolveRoomUpdate({...base,cashbackAmount:0,totalCommission:900000},base);
 assert.equal(data.cashbackAmount,0);assert.equal(data.totalCommission,900000);assert.equal(data.netProfit,900000);
});
test('missing overrides recalculate on price/rate change; unrelated edits preserve amounts',()=>{
 assert.equal(resolveRoomUpdate({price:4000000},base).cashbackAmount,360000);
 assert.equal(resolveRoomUpdate({price:4000000},base).totalCommission,2000000);
 assert.equal(resolveRoomUpdate({commissionRate:25},base).totalCommission,875000);
 assert.equal(resolveRoomUpdate({description:'Updated'},base).totalCommission,1750000);
});
test('financial validation, note normalization and owner phone mapping',()=>{
 for(const invalid of [{price:-1},{cashbackAmount:-1},{totalCommission:'abc'},{commissionRate:101},{price:true}])assert.throws(()=>resolveRoomUpdate(invalid,base));
 const data=resolveRoomUpdate({notes:'A\n\nB',contactPhone:'0912345678',createdBy:'injected'},base);
 assert.deepEqual(data.notes,['A','B']);assert.equal(data.ownerInfo.name,'Chủ nhà');assert.equal(data.ownerInfo.phone,'0912345678');assert.equal(data.createdBy,undefined);
});
test('model save hooks preserve explicit zero and manual commission on creation',async()=>{
 const room=new Room({code:'TEST',displayId:'TEST-1',address:'Cầu Giấy',price:3500000,commissionRate:50,cashbackAmount:0,totalCommission:900000});
 await Room.schema.s.hooks.execPre('save',room,[]);
 assert.equal(room.cashbackAmount,0);assert.equal(room.totalCommission,900000);assert.equal(room.netProfit,900000);
 const auto=new Room({code:'AUTO',displayId:'AUTO-1',address:'Cầu Giấy',price:3500000,commissionRate:50});
 await Room.schema.s.hooks.execPre('save',auto,[]);assert.equal(auto.cashbackAmount,315000);assert.equal(auto.totalCommission,1750000);
});
test('text parser distinguishes absent cashback from explicit zero',()=>{
 assert.equal(parseZaloText('Mã: A\nGiá: 3,5tr').cashbackAmount,undefined);
 assert.equal(parseZaloText('Mã: A\nGiá: 3,5tr\nHoàn khách: 0').cashbackAmount,0);
});
test('Excel controller imports numeric price and reports invalid row without external services',async()=>{
 const originalFind=Room.findOne,originalSave=Room.prototype.save;const saved=[];
 Room.findOne=async()=>null;Room.prototype.save=async function(){await Room.schema.s.hooks.execPre('save',this,[]);saved.push(this);return this};
 try{
  const wb=xlsx.utils.book_new();xlsx.utils.book_append_sheet(wb,xlsx.utils.json_to_sheet([{'Mã':'EX1','Địa chỉ':'Cầu Giấy','Giá':3500000,'Hoa hồng':50},{'Mã':'EX2','Địa chỉ':'Đống Đa','Giá':-1}]),'Phòng');
  const res=response();await roomController.importExcelRooms({files:{file:[{buffer:xlsx.write(wb,{type:'buffer',bookType:'xlsx'})}]}},res);
  assert.equal(res.statusCode,200);assert.equal(res.data.results.success,1);assert.equal(res.data.results.failed,1);assert.equal(saved[0].price,3500000);assert.equal(saved[0].commissionRate,50);
 }finally{Room.findOne=originalFind;Room.prototype.save=originalSave;}
});
test('room update controller sends validated manual values to persistence',async()=>{
 const find=Room.findById,update=Room.findByIdAndUpdate;let payload,options;
 Room.findById=async()=>base;Room.findByIdAndUpdate=async(_id,data,opts)=>{payload=data;options=opts;return {...base,...data}};
 try{const res=response();await roomController.updateRoom({params:{id:'a'},body:{...base,cashbackAmount:0,totalCommission:123456}},res);assert.equal(res.statusCode,200);assert.equal(payload.totalCommission,123456);assert.equal(payload.cashbackAmount,0);assert.equal(options.runValidators,true);}
 finally{Room.findById=find;Room.findByIdAndUpdate=update;}
});
test('public registration ignores a supplied admin role',async()=>{
 const find=User.findOne,save=User.prototype.save;let saved;
 User.findOne=async()=>null;User.prototype.save=async function(){await this.validate();saved=this;return this};
 try{const res=response();await authController.registerUser({body:{username:'Regression',email:'regression@example.invalid',password:'test-password',role:'admin'}},res);assert.equal(res.statusCode,201);assert.equal(saved.role,'user');assert.equal(res.data.user.role,'user');}
 finally{User.findOne=find;User.prototype.save=save;}
});
