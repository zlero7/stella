import test from 'node:test'
import assert from 'node:assert/strict'
import { nickKey, applyLadder, applyPlay, canEquip, classOf, classPoints, duelResult, ladderDelta, levelOf, playExp, profileView, tierOf } from './progress.mjs'

test('레벨: 경험치로 레벨과 이번 레벨 진행도를 센다', () => {
  assert.deepEqual(levelOf(0), { level: 1, cur: 0, need: 110 })
  assert.deepEqual(levelOf(110), { level: 2, cur: 0, need: 120 })
  assert.deepEqual(levelOf(109), { level: 1, cur: 109, need: 110 })
  assert.equal(levelOf(1e9).level, 999)
})
test('경험치: 점수가 높고 풀콤보·올퍼펙트면 더 받는다', () => {
  assert.equal(playExp(0, ''), 20)
  assert.equal(playExp(1_000_000, 'ALL PERFECT'), 80)
  assert.ok(playExp(900000, 'FULL COMBO') > playExp(900000, ''))
})
test('티어: LP 경계', () => {
  assert.equal(tierOf(0).label, 'IRON IV')
  assert.equal(tierOf(99).label, 'IRON IV')
  assert.equal(tierOf(100).label, 'IRON III')
  assert.equal(tierOf(399).label, 'IRON I')
  assert.equal(tierOf(400).label, 'BRONZE IV')
  assert.equal(tierOf(2399).label, 'DIAMOND I')
  assert.deepEqual(tierOf(2450), { tier: 'MASTER', div: 0, pt: 50, label: 'MASTER' })
})
test('래더 LP: 이기면 오르고 지면 내려가며, 강한 상대를 이기면 더 오른다', () => {
  assert.ok(ladderDelta(1000, 1000, 1) >= 8)
  assert.ok(ladderDelta(1000, 1000, 0) <= -8)
  assert.ok(ladderDelta(1000, 1400, 1) > ladderDelta(1000, 600, 1))
  assert.equal(ladderDelta(1000, 1000, 0.5), 0)
  const u = { lp: 5 }; applyLadder(u, 1000, 0); assert.equal(u.lp, 0) // LP는 0 아래로 안 내려간다
})
test('승패: 실패한 쪽이 지고, 같은 상태면 점수', () => {
  assert.equal(duelResult({ score: 100, failed: true }, { score: 1, failed: false }), 0)
  assert.equal(duelResult({ score: 5, failed: false }, { score: 9, failed: false }), 0)
  assert.equal(duelResult({ score: 9, failed: false }, { score: 9, failed: false }), 0.5)
})
test('DJ CLASS: 상위 20곡만 더하고 난이도 가중치를 곱한다', () => {
  assert.equal(classPoints({ 'a/4k-hard': 1_000_000 }), 100)
  assert.equal(classPoints({ 'a/4k-stella': 1_000_000 }), 125)
  assert.equal(classPoints({ 'imp-0116c57d38/4k-easy': 1_000_000, 'imp-0292531b9c/4k-stella': 1_000_000 }), 175) // 곡 폴더 이름에도 -가 있다
  const many = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`s${i}/4k-hard`, 1_000_000]))
  assert.equal(classPoints(many), 2000)
  assert.equal(classOf(0).label, 'BEGINNER IV')
  assert.equal(classOf(149).name, 'BEGINNER')
  assert.equal(classOf(150).name, 'ROOKIE')
  assert.equal(classOf(5000).label, 'THE STELLA')
})
test('꾸미기: 조건을 못 채운 건 못 낀다', () => {
  const u = { exp: 0 }
  assert.equal(canEquip(u, 'plate', 'default'), true)
  assert.equal(canEquip(u, 'plate', 'nova'), false)
  assert.equal(canEquip(u, 'title', 'veteran'), false)
  assert.equal(canEquip({ exp: 100000 }, 'plate', 'nova'), true)
  assert.equal(canEquip(u, 'plate', 'nope'), false)
})
test('한 판 기록: 곡별 최고 점수는 낮은 점수로 덮이지 않는다', () => {
  const u = {}
  applyPlay(u, 'a/4k-hard', 900000, 'FULL COMBO'); applyPlay(u, 'a/4k-hard', 500000, '')
  assert.equal(u.bests['a/4k-hard'], 900000); assert.equal(u.plays, 2); assert.equal(u.fcs, 1)
})
test('프로필: 해금 안 된 꾸미기는 기본으로 돌아간다', () => {
  const v = profileView({ id: 'x', nick: 'X', exp: 0, plate: 'supernova', title: 'lord' })
  assert.equal(v.plate, 'default'); assert.equal(v.title, ''); assert.equal(v.level, 1)
})
test('래더를 한 판도 안 했으면 UNRANKED, 한 판 하면 티어가 보인다', () => {
  assert.equal(profileView({ id: 'x', nick: 'X' }).tierLabel, 'UNRANKED')
  assert.equal(profileView({ id: 'x', nick: 'X', losses: 1 }).tierLabel, 'IRON IV')
})
test('닉네임 중복 키: 대소문자·공백·전각·_·-만 다른 이름은 같다', () => {
  for (const n of ['nova', 'NOVA', 'N o v a', 'ｎｏｖａ', 'nova_', 'no-va']) assert.equal(nickKey(n), 'nova')
  assert.notEqual(nickKey('nova'), nickKey('novb'))
  assert.equal(nickKey('스텔 라'), nickKey('스텔라'))
})

test('같은 곡을 같은 날 반복하면 경험치가 줄고, 다음 날에는 다시 전부 받는다', () => {
  const u = {}, day1 = Date.UTC(2026, 10, 11, 3), day2 = Date.UTC(2026, 10, 12, 3)
  const g1 = applyPlay(u, 'a/4k-hard', 900000, '', day1), g2 = applyPlay(u, 'a/4k-hard', 900000, '', day1 + 1000)
  assert.equal(g1, playExp(900000, '')); assert.equal(g2, Math.max(5, Math.floor(g1 * 0.25)))
  assert.equal(applyPlay(u, 'b/4k-hard', 900000, '', day1 + 2000), g1) // 다른 곡은 전부
  assert.equal(applyPlay(u, 'a/4k-hard', 900000, '', day2), g1) // 다음 날은 전부
  assert.equal(u.plays, 4) // 플레이 수는 그대로 센다
})
