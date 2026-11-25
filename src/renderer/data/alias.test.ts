import test from 'node:test'
import assert from 'node:assert/strict'
import { aliasOf } from './alias.ts'

test('가수 이름을 한글로도 찾게 한다', () => {
  assert.match(aliasOf('HERO', 'Vaundy'), /바운디/)
  assert.match(aliasOf('唱', 'Ado'), /아도/)
})
test('제목 읽기는 가수가 맞을 때만, 낱말 단위로 붙는다', () => {
  assert.match(aliasOf('HERO', 'Vaundy'), /히어로/)
  assert.equal(aliasOf('HERO', 'Steve'), '')
  assert.match(aliasOf('新時代 (ウタ from ONE PIECE FILM RED) [ cover. 누구 ]', 'Ado'), /아도/)
})
test('그린애플도 한글로 찾는다', () => {
  assert.match(aliasOf('CHEERS', 'Mrs. GREEN APPLE'), /그린애플/)
  assert.match(aliasOf('CHEERS', 'Mrs. GREEN APPLE'), /치어스/)
})
test('요네즈 켄시도 한글로 찾는다', () => {
  assert.match(aliasOf('Lemon', 'Kenshi Yonezu'), /요네즈 켄시/)
  assert.match(aliasOf('Lemon', 'Kenshi Yonezu'), /레몬/)
})
