import test from 'node:test'
import assert from 'node:assert/strict'
import { SceneManager } from './SceneManager.ts'

test('꾹 누름(repeat): 방향키만 일정 간격으로 전달하고 Enter·글자 키는 한 번만', () => {
  const sm = new SceneManager(), got: string[] = []
  sm.add('a', { render() {}, keydown: e => got.push(e.key) })
  sm.go('a')
  const key = (k: string, repeat: boolean, timeStamp = 0) => sm.keydown({ key: k, repeat, timeStamp } as KeyboardEvent)
  key('ArrowDown', false); key('ArrowDown', true, 500); key('ArrowDown', true, 530); key('ArrowDown', true, 560) // 30ms 간격(Windows 기본)은 솎아서 받는다
  key('ArrowDown', true, 620); key('ArrowDown', true, 700); key('ArrowDown', true, 740)
  key('Enter', false); key('Enter', true, 900); key('d', true, 900)
  assert.deepEqual(got, ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'Enter'])
})
