// 래더 매치: 대기열 → LP가 비슷한 두 사람을 짝지음 → 곡 5개 중 번갈아 밴(마지막 한 곡으로 승부) → 둘 다 준비되면 중계(대결과 같은 연결)로 한 판 → 결과를 서버가 판정해 LP를 바꾼다.
// 서버는 소켓을 직접 만지지 않고 sock.send(문자열)·sock.st(자유 칸)만 쓴다 (시험에서는 가짜 소켓을 넣는다)
import crypto from 'node:crypto'
import { applyLadder, duelResult, publicView, tierOf } from './progress.mjs'

export const TURN_MS = 15000 // 밴 한 번에 주는 시간 (넘으면 아무거나 대신 밴)
export const READY_MS = 5 * 60 * 1000 // 곡 받는 시간 (곡 하나가 30~100MB라 느린 회선도 받을 수 있게)
export const MIN_PLAY = 0.8 // 끝까지 친 결과는 곡 길이의 이만큼이 지나야 받는다 (치기 전에 만점을 올리는 걸 막는다)
export const MATCH_MAX_MS = 12 * 60 * 1000 // 이 시간이 지나도록 결과가 안 오면 접는다
export const POOL = 5, KEYS = 4
export const BOT_WAIT_MS = 45000 // 이만큼 기다려도 상대가 없으면 봇과 붙는다 (접속자가 적어도 래더를 칠 수 있게)
export const BOT_MAX_LP = 800 // 봇은 낮은 티어(LP가 이보다 낮은 사람)에게만 붙는다. 높은 티어는 늘 사람과 친다
export const BOT_NICK = '스텔라 봇'

export function findPair(queue, now) {
  for (let i = 0; i < queue.length; i++) for (let j = i + 1; j < queue.length; j++) {
    const a = queue[i], b = queue[j]
    if (a.user.id === b.user.id) continue
    const wait = Math.max(now - a.since, now - b.since), room = 100 + 25 * Math.floor(wait / 5000) // 기본 ±100 LP, 5초마다 25씩 넓어진다
    if (Math.abs((a.user.lp ?? 0) - (b.user.lp ?? 0)) <= room) return [a, b]
  }
}
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1);[a[i], a[j]] = [a[j], a[i]] } return a }
const tx = (sock, o) => { try { sock.send(JSON.stringify(o)) } catch { /* 이미 끊김 */ } }

// pool(): 래더에 쓸 수 있는 곡 [{dir, diff, title, artist}] · len(dir, diff): 곡을 끝까지 치는 데 걸리는 초 · save(): 계정 저장 · now(): 시각(시험용)
// 시험용: botWait(대기 ms) · botDelay(봇이 밴·준비하기 전 ms) · botTick(점수를 보내는 간격 ms) · botMinLen(봇이 한 판을 치는 최소 초)
export function createLadder({ pool, len = () => 0, save, log = () => {}, now = Date.now, botWait = BOT_WAIT_MS, botDelay = 1500, botTick = 250, botMinLen = 20 }) {
  const queue = [] // {sock, user, since}
  const matches = new Map() // mid -> 판
  const busy = id => queue.some(q => q.user.id === id) || [...matches.values()].some(m => m.phase !== 'done' && m.players.some(p => p.user.id === id && !p.gone)) // 나간 사람은 판이 끝나기 전이어도 다시 래더를 할 수 있다

  function start(a, b, bot = false) {
    const songs = shuffle(pool()).slice(0, POOL)
    if (songs.length < POOL) { for (const q of [a, b]) { tx(q.sock, { t: 'r_err', msg: '래더에 쓸 곡이 부족합니다' }); q.sock.st.ladder = undefined } return }
    const first = crypto.randomInt(2), mid = crypto.randomBytes(8).toString('hex')
    const m = { mid, at: now(), phase: 'ban', songs, banned: [], turn: first, first, timer: undefined, players: [a, b].map(q => ({ sock: q.sock, user: q.user, lp0: q.user.lp ?? 0, ready: false, gone: false, rep: undefined })), result: undefined }
    if (bot) { m.bot = true; m.players[1].bot = true; b.sock.m = m } // 둘째 자리는 봇
    matches.set(mid, m)
    m.players.forEach((p, i) => {
      p.sock.st.ladder = m
      tx(p.sock, { t: 'l_match', mid, opp: publicView(m.players[1 - i].user), songs: songs.map(({ dir, diff, title, artist }) => ({ dir, diff, title, artist })), turn: m.turn === i ? 'you' : 'opp', tleft: TURN_MS / 1000 })
    })
    log('래더 매치', m.players.map(p => p.user.nick).join(' vs '))
    arm(m)
  }
  function arm(m) { // 이번 차례에 시간을 준다
    clearTimeout(m.timer)
    m.timer = setTimeout(() => { const free = m.songs.map((_, i) => i).filter(i => !m.banned.includes(i)); ban(m, m.turn, free[crypto.randomInt(free.length)]) }, TURN_MS)
    m.timer.unref?.()
  }
  function ban(m, who, idx) {
    if (m.phase !== 'ban' || m.turn !== who || !Number.isInteger(idx) || idx < 0 || idx >= m.songs.length || m.banned.includes(idx)) return
    m.banned.push(idx)
    if (m.banned.length < m.songs.length - 1) {
      m.turn = 1 - who; arm(m)
      m.players.forEach((p, i) => tx(p.sock, { t: 'l_ban', idx, by: i === who ? 'you' : 'opp', turn: m.turn === i ? 'you' : 'opp', tleft: TURN_MS / 1000 }))
      return
    }
    clearTimeout(m.timer)
    m.phase = 'prep'; m.pick = m.songs.findIndex((_, i) => !m.banned.includes(i))
    const s = m.songs[m.pick]
    m.players.forEach((p, i) => tx(p.sock, { t: 'l_ban', idx, by: i === who ? 'you' : 'opp', turn: 'none', tleft: 0 }))
    m.players.forEach(p => tx(p.sock, { t: 'l_start', mid: m.mid, idx: m.pick, dir: s.dir, diff: s.diff, keys: KEYS }))
    m.timer = setTimeout(() => cancel(m, '곡을 받지 못해 매치가 취소됐습니다'), READY_MS); m.timer.unref?.()
  }
  // 봇: 소켓처럼 보이는 객체. 밴·준비를 알아서 하고, 사람이 방장이 되어 보내는 채보·준비 신호에 맞춰 점수를 흘려 보낸다
  function botSock(user) {
    const timers = new Set(), s = { st: {}, m: undefined, send(raw) { let m; try { m = JSON.parse(String(raw)) } catch { return } react(m) }, close() { stop() }, terminate() { stop() }, stop }
    const later = (ms, fn) => { const t = setTimeout(fn, ms); t.unref?.(); timers.add(t) }
    const say = o => { try { s.st.peer?.send(JSON.stringify(o)) } catch { /* 상대가 끊김 */ } }
    function stop() { for (const t of timers) { clearTimeout(t); clearInterval(t) } timers.clear() }
    function botBan() {
      const m = s.m; if (!m || m.phase !== 'ban' || m.turn !== 1) return
      const free = m.songs.map((_, i) => i).filter(i => !m.banned.includes(i)); ban(m, 1, free[crypto.randomInt(free.length)])
    }
    function simulate() { // 한 판을 치는 척: 곡 길이에 걸쳐 점수가 올라가고, 끝에 결과를 낸다 (88~97점대)
      const m = s.m, p = m.players[1], sg = m.songs[m.pick], total = Math.max(len(sg.dir, sg.diff), botMinLen), t0 = now()
      const fin = Math.round(1e6 * (0.88 + 0.09 * Math.random())), acc = +Math.min(100, 70 + fin / 1e6 * 30).toFixed(2), mc = Math.round(total * 4 * (0.6 + 0.4 * Math.random()))
      const iv = setInterval(() => {
        const prog = Math.min((now() - t0) / 1000 / total, 1)
        if (prog < 1) { say({ t: 'score', s: Math.round(fin * prog), c: Math.round(mc * prog), hp: 100, a: acc }); return }
        clearInterval(iv); timers.delete(iv)
        say({ t: 'done', s: fin, a: acc, mc, failed: false, rank: acc >= 99 ? 'S+' : acc >= 95 ? 'S' : acc >= 90 ? 'A' : 'B' })
        if (m.phase === 'play') { p.rep = { score: fin, failed: false }; if (settled(m)) finish(m) }
      }, botTick)
      timers.add(iv); s.sim = true
    }
    function react(m) {
      if (m.t === 'l_match' || m.t === 'l_ban') { if (m.turn === 'you') later(botDelay, botBan) }
      else if (m.t === 'l_start') later(botDelay, () => self.message(s, { t: 'l_ready' }))
      else if (m.t === 'chart') { say({ t: 'hello', nick: user.nick }); say({ t: 'ready' }) }
      else if (m.t === 'ready' && !s.sim) simulate()
    }
    return s
  }
  function startBot(q) {
    queue.splice(queue.indexOf(q), 1)
    const user = { id: 'bot-' + crypto.randomBytes(4).toString('hex'), nick: BOT_NICK, lp: q.user.lp ?? 0, exp: 0 } // 봇의 LP는 상대와 같게: 이기면 오르고 지면 내린다
    start(q, { sock: botSock(user), user, since: now() }, true)
  }
  function cancel(m, msg) { // LP 변화 없이 접는다
    if (m.phase === 'done') return
    clearTimeout(m.timer); m.phase = 'done'
    for (const p of m.players) { p.sock.stop?.(); p.sock.st.ladder = undefined; if (!p.gone) tx(p.sock, { t: 'l_cancel', msg }) }
  }
  function go(m) { // 둘 다 준비됐다: 두 연결을 이어 주면 그 뒤는 대결과 같다
    clearTimeout(m.timer); m.phase = 'play'; m.playAt = now()
    const [a, b] = m.players
    a.sock.st.peer = b.sock; b.sock.st.peer = a.sock
    for (const p of m.players) p.sock.st.ladder = undefined
    m.players.forEach((p, i) => { tx(p.sock, { t: 'r_paired' }); tx(p.sock, { t: 'l_go', role: i === (m.bot ? 0 : m.first) ? 'host' : 'guest' }) })
  }

  function finish(m) {
    if (m.phase === 'done' && m.result) return
    clearTimeout(m.timer)
    const [a, b] = m.players, ra = a.rep, rb = b.rep
    let resA
    if (ra && rb) resA = duelResult(ra, rb)
    else if (ra || rb) { // 한쪽만 결과를 냈다: 상대는 나간 것. 끝까지 친 쪽이 이긴다 (실패했으면 무승부)
      const r = ra ?? rb, win = r.failed ? 0.5 : 1
      resA = ra ? win : 1 - win
    } else { m.phase = 'done'; for (const p of m.players) p.sock.stop?.(); return } // 둘 다 안 냄: 없던 일
    m.phase = 'done'; for (const p of m.players) p.sock.stop?.()
    const lpA = a.user.lp ?? 0, lpB = b.user.lp ?? 0
    const dA = applyLadder(a.user, lpB, resA), dB = applyLadder(b.user, lpA, 1 - resA)
    m.result = [{ res: resA, d: dA }, { res: 1 - resA, d: dB }]
    save(); log('래더 결과', a.user.nick, resA, b.user.nick)
  }
  const settled = m => { // 결과를 낼 수 있는 상태인가
    const [a, b] = m.players
    return (a.rep && b.rep) || (a.rep && b.gone) || (b.rep && a.gone) || (a.gone && b.gone)
  }

  const self = {
    queued: () => queue.length,
    join(sock, user) {
      if (sock.st.ladder || sock.st.peer || sock.st.code) return
      if (busy(user.id)) { tx(sock, { t: 'r_err', msg: '이미 래더 중인 계정입니다' }); return }
      queue.push({ sock, user, since: now() }); sock.st.ladder = 'queue'
      tx(sock, { t: 'l_wait', queued: queue.length })
      this.tick()
    },
    tick() {
      for (let p; (p = findPair(queue, now()));) { for (const q of p) queue.splice(queue.indexOf(q), 1); start(...p) }
      for (const q of [...queue]) if (now() - q.since >= botWait && (q.user.lp ?? 0) < BOT_MAX_LP) startBot(q) // 오래 기다린 낮은 티어는 봇과
      for (const [mid, m] of matches) { // 멈춘 판과 오래된 기록 정리
        if (m.phase === 'play' && (settled(m) || now() - m.playAt > MATCH_MAX_MS)) finish(m)
        if (m.phase === 'done' && now() - m.at > MATCH_MAX_MS + 10 * 60 * 1000) matches.delete(mid)
      }
    },
    message(sock, m) {
      const match = sock.st.ladder
      if (!match || match === 'queue') return
      const me = match.players.findIndex(p => p.sock === sock)
      if (me < 0) return
      if (m.t === 'l_ban') ban(match, me, m.idx)
      else if (m.t === 'l_ready' && match.phase === 'prep') { match.players[me].ready = true; if (match.players.every(p => p.ready)) go(match) }
    },
    close(sock) {
      const st = sock.st.ladder
      if (st === 'queue') { const i = queue.findIndex(q => q.sock === sock); if (i >= 0) queue.splice(i, 1); sock.st.ladder = undefined; return }
      for (const m of matches.values()) { // 판 중에 나감: 밴·준비 중이면 취소, 치는 중이면 나간 사람으로 표시
        const p = m.players.find(p => p.sock === sock); if (!p || m.phase === 'done') continue
        p.gone = true
        if (m.bot && m.phase === 'play' && !p.rep) { finish(m); continue } // 봇 판에서 사람이 결과 없이 나가면 바로 접는다 (LP 변화 없음). 결과를 낸 뒤 나갔으면 봇이 끝까지 쳐서 결과를 낸다
        if (m.phase === 'ban' || m.phase === 'prep') cancel(m, '상대가 나가서 매치가 취소됐습니다')
        else if (settled(m)) finish(m)
      }
    },
    // 한 판이 끝난 뒤 내 결과를 올린다 (한 번만). 상대도 올리면 바로, 아니면 나중에 판정한다
    report(user, mid, r) {
      const m = matches.get(String(mid)), p = m?.players.find(p => p.user.id === user.id)
      if (!p || m.phase !== 'play' || p.rep) return false
      if (!Number.isInteger(r.score) || r.score < 0 || r.score > 1_000_000 || typeof r.failed !== 'boolean') return false
      const s = m.songs[m.pick]
      if (!r.failed && now() - m.playAt < len(s.dir, s.diff) * 1000 * MIN_PLAY) return false // 실패(포기)는 일찍 올 수 있다: 자기에게 불리한 쪽이라
      p.rep = { score: r.score, failed: r.failed }
      if (settled(m)) finish(m)
      return true
    },
    result(user, mid) {
      const m = matches.get(String(mid)), i = m?.players.findIndex(p => p.user.id === user.id)
      if (!m || i < 0) return { state: 'none' }
      if (m.phase === 'play' && settled(m)) finish(m)
      if (!m.result) return { state: m.phase === 'done' ? 'none' : 'wait' }
      const { res, d } = m.result[i], lp = m.players[i].user.lp ?? 0
      return { state: 'done', result: res === 1 ? 'WIN' : res === 0 ? 'LOSE' : 'DRAW', delta: d, lp, tierLabel: tierOf(lp).label, opp: publicView(m.players[1 - i].user) }
    }
  }
  return self
}
