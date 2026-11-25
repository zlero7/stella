// 스킨마다 기어의 "생김새" 자체가 다르다: 틀(기둥·날개·장식)·콘솔 모양·건반 모양·점수창/칩 모양을 스킨이 따로 그린다 (색만 바꾼 같은 기어가 아니다)
// 그림 본문은 skinsArt2~6.ts에 있고, gear.ts가 이 ART에 합친다
import type { GearSkin, Lit } from './gear'

type G = CanvasRenderingContext2D
export type PathFn = (g: G, x: number, y: number, w: number, h: number) => void
export interface Art {
  back(g: G, x: number, fw: number, jy: number, pa: number, lit: Lit, k0: GearSkin): void // 필드·틀·램프 (노트 아래)
  consoleBack(g: G, x: number, fw: number, jy: number, diffCol: string, chibi: boolean, k0: GearSkin): void // 콘솔 몸통·캐릭터 (건반 아래)
  key(g: G, x: number, y: number, w: number, h: number, on: boolean, blue: boolean, label: string, k0: GearSkin, nc: string): void // 건반 하나
  lcd?: PathFn; chip?: PathFn // 점수창·칩의 윤곽 (없으면 둥근 네모)
}
export const ART: Record<string, Art> = {}
