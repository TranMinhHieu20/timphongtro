import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parsePriceValue} from '../src/services/priceParser.js';
import {parsePriceValue as backendPrice} from '../../backend/src/lib/zaloParser.js';

test('admin and Excel parse the same supported Vietnamese price formats',()=>{
 for(const [input,expected] of [[3500000,3500000],['3,5tr',3500000],['3.5tr',3500000],['3tr5',3500000],['3tr50',3500000],['3.500.000đ',3500000],['3,500,000 VND',3500000],['500k',500000],['0',0]]){
  assert.equal(parsePriceValue(input),expected);assert.equal(backendPrice(input),expected);
 }
});
test('admin rejects malformed amounts instead of silently changing the value',()=>{
 for(const input of [-1,'-3,5tr','abc','3.50.000',null,''])assert.ok(Number.isNaN(parsePriceValue(input)));
});
