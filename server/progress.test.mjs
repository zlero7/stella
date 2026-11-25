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

test('레벨 31~100 보상: 레벨이 되면 열리고, 새로 열린 것만 unlocked에 남는다', () => {
  const lv = n => { let e = 0; for (let l = 1; l < n; l++) e += 100 + 10 * l; return e }
  const u = { id: 'x', exp: lv(40) - 5 }
  assert.equal(canEquip(u, 'plate', 'nebula'), false)
  applyPlay(u, 'a/4k-hard', 1_000_000, 'ALL PERFECT') // +80 exp → 레벨 40
  assert.deepEqual(u.unlocked.plates, [{ id: 'nebula', name: 'NEBULA' }])
  assert.deepEqual(u.unlocked.titles.map(t => t.id), ['ap']) // 레벨 35 칭호는 이미 열려 있었고, 올퍼펙트 칭호만 새로 열렸다
  assert.equal(canEquip(u, 'plate', 'nebula'), true)
})
test('unlocked: 이미 열린 것은 다시 안 나오고, 옛 계정(unlocked 없음)도 프로필이 나온다', () => {
  const u = { id: 'x', exp: 0 }
  assert.deepEqual(profileView(u).unlocked, { at: 0, plates: [], titles: [] })
  applyPlay(u, 'a/4k-hard', 0, '')
  assert.deepEqual(u.unlocked.plates, [])
  const big = { id: 'y', exp: 1e9 }; applyPlay(big, 'a/4k-hard', 0, '')
  assert.deepEqual(big.unlocked.plates.map(p => p.id).sort(), [])  // 이 판 전에 이미 다 열려 있었다
})

import { classTop, gradeOf, DAILY_BONUS } from './progress.mjs'
test('DJ CLASS 기여 목록: 점수×난이도 가중치 상위, 합계와 맞는다', () => {
  const bests = { 'a/4k-hard': 900000, 'a/4k-easy': 900000, 'b-c/4k-stella': 800000 }
  const t = classTop(bests)
  assert.deepEqual(t.map(x => x.k), ['b-c/4k-stella', 'a/4k-hard', 'a/4k-easy'])
  assert.deepEqual(t.map(x => x.pts), [100, 90, 45])
  assert.equal(Math.round(t.reduce((s, x) => s + x.pts, 0)), classPoints(bests))
})
test('일일 목표: 오늘 서로 다른 곡 3곡을 치면 보너스가 한 번만', () => {
  const u = {}, day = Date.UTC(2026, 0, 10, 3)
  const g1 = applyPlay(u, "a/4k-hard", 900000, "", day); applyPlay(u, "a/4k-easy", 900000, "", day + 1000) // 같은 곡 다른 난이도: 아직 1곡
  assert.equal(profileView(u, day + 2000).daily.have, 1)
  const g3 = applyPlay(u, 'b/4k-hard', 900000, '', day + 2000)
  assert.equal(g3, g1) // 2곡째: 보너스 없음
  assert.equal(profileView(u, day + 3000).daily.claimed, false)
  const g4 = applyPlay(u, 'c/4k-hard', 900000, '', day + 3000)
  assert.equal(g4, playExp(900000, '') + DAILY_BONUS) // 3곡째: 보너스
  assert.equal(profileView(u, day + 4000).daily.claimed, true)
  const g5 = applyPlay(u, 'd/4k-hard', 900000, '', day + 4000)
  assert.equal(g5, playExp(900000, '')) // 그날 두 번째 보너스는 없다
  assert.equal(profileView(u, day + 2 * 86400e3).daily.have, 0) // 다음 날은 처음부터
})
test('통계 누계와 업적 진행도', () => {
  const u = {}, now = Date.UTC(2026, 0, 10, 3)
  applyPlay(u, 'a/4k-stella', 950000, 'FULL COMBO', now, { n: [8, 1, 1, 0, 0, 0], acc: 96, sec: 100 })
  applyPlay(u, 'a/6k-hard', 800000, '', now + 1, { n: [5, 2, 1, 1, 0, 1], acc: 81, sec: 5000 })
  const v = profileView(u, now + 2)
  assert.deepEqual(v.stats.judged, [13, 3, 2, 1, 0, 1])
  assert.deepEqual(v.stats.grades, { S: 1, B: 1 })
  assert.equal(v.stats.playSec, 100 + 1200) // 한 판 시간은 1200초까지만
  assert.deepEqual(v.stats.favorite, [{ dir: 'a', plays: 2 }])
  const ach = Object.fromEntries(v.achievements.map(a => [a.id, a]))
  assert.equal(ach.first.done, true); assert.equal(ach.six.done, true); assert.equal(ach.stella.done, true); assert.equal(ach.plays100.cur, 2); assert.equal(ach.win1.done, false)
  assert.equal(gradeOf(98.9), 'S'); assert.equal(gradeOf(99), 'S+'); assert.equal(gradeOf(69.9), 'D')
})
