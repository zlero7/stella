# Splits a transparent character sheet (2 rows x N columns, empty gaps between characters) into assets/chibi/<id>-l.png and <id>-r.png, height 352px.
# Characters are taken in reading order (top row left to right, then bottom row) and named by -Names, e.g. sakura-r,forest-l,... (file = <name>.png)
# Usage: powershell -File tools/split-chibi-sheet.ps1 -Source "C:\path\sheet.png" -Names "sakura-r,forest-l,forest-r,crimson-l,ocean-l,ocean-r,violet-l,gold-l,gold-r,ice-l"
param([Parameter(Mandatory)][string]$Source, [Parameter(Mandatory)][string]$Names)
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
public static class Mask {
  public static int[] Rows(byte[] b, int stride, int w, int h) { var r = new int[h]; for (int y = 0; y < h; y++) { int c = 0; for (int x = 0; x < w; x++) if (b[y * stride + x * 4 + 3] > 24) c++; r[y] = c; } return r; }
  public static int[] Cols(byte[] b, int stride, int w, int y0, int y1) { var r = new int[w]; for (int x = 0; x < w; x++) { int c = 0; for (int y = y0; y <= y1; y++) if (b[y * stride + x * 4 + 3] > 24) c++; r[x] = c; } return r; }
  public static int[] Box(byte[] b, int stride, int x0, int x1, int y0, int y1) {
    int xa = int.MaxValue, xb = -1, ya = int.MaxValue, yb = -1;
    for (int y = y0; y <= y1; y++) for (int x = x0; x <= x1; x++) if (b[y * stride + x * 4 + 3] > 24) { if (x < xa) xa = x; if (x > xb) xb = x; if (y < ya) ya = y; if (y > yb) yb = y; }
    return new int[] { xa, xb, ya, yb };
  }
}
'@
$out = Join-Path $PSScriptRoot '..\src\renderer\assets\chibi'
New-Item -ItemType Directory -Force $out | Out-Null
$b = [System.Drawing.Bitmap]::FromFile($Source); $W = $b.Width; $H = $b.Height
$d = $b.LockBits((New-Object System.Drawing.Rectangle 0, 0, $W, $H), 'ReadOnly', 'Format32bppArgb'); $stride = $d.Stride
$buf = New-Object byte[] ($stride * $H); [System.Runtime.InteropServices.Marshal]::Copy($d.Scan0, $buf, 0, $buf.Length); $b.UnlockBits($d)
# empty runs (length, first, last) inside [lo, hi] of a projection
function Gaps($proj, $lo, $hi) {
  $runs = @(); $i = $lo
  while ($i -le $hi) { if ($proj[$i] -eq 0) { $j = $i; while ($j -le $hi -and $proj[$j] -eq 0) { $j++ }; $runs += , @(($j - $i), $i, ($j - 1)); $i = $j } else { $i++ } }
  $runs
}
$rowp = [Mask]::Rows($buf, $stride, $W, $H)
$ya = 0; while ($rowp[$ya] -eq 0) { $ya++ }; $yb = $H - 1; while ($rowp[$yb] -eq 0) { $yb-- }
$rowGap = Gaps $rowp $ya $yb | Sort-Object { $_[0] } -Descending | Select-Object -First 1
if (-not $rowGap) { throw 'No empty band between the two rows.' }
$ymid = [int](($rowGap[1] + $rowGap[2]) / 2)
$bands = @(@($ya, $ymid), @(($ymid + 1), $yb))
function Crop($x0, $x1, $y0, $y1, $name) {
  $bx = [Mask]::Box($buf, $stride, $x0, $x1, $y0, $y1); $xa = $bx[0]; $w = $bx[1] - $xa + 1; $ya2 = $bx[2]; $h = $bx[3] - $ya2 + 1
  $th = 352; $tw = [int]($w * $th / $h)
  $o = New-Object System.Drawing.Bitmap $tw, $th, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.Color]::Transparent); $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
  $g.DrawImage($b, (New-Object System.Drawing.Rectangle 0, 0, $tw, $th), (New-Object System.Drawing.Rectangle $xa, $ya2, $w, $h), 'Pixel'); $g.Dispose()
  $o.Save((Join-Path $out $name), [System.Drawing.Imaging.ImageFormat]::Png); $o.Dispose(); "$name ${tw}x${th}"
}
$List = $Names -split "," | ForEach-Object { $_.Trim() }; $n = [int]($List.Count / 2) # 2 rows x n columns
for ($r = 0; $r -lt 2; $r++) {
  $y0 = $bands[$r][0]; $y1 = $bands[$r][1]
  $colp = [Mask]::Cols($buf, $stride, $W, $y0, $y1)
  $xa = 0; while ($colp[$xa] -eq 0) { $xa++ }; $xb = $W - 1; while ($colp[$xb] -eq 0) { $xb-- }
  # cut each column boundary where the sheet is emptiest near the expected position (works even when neighbours slightly touch)
  $cw = ($xb - $xa + 1) / $n; $cuts = @()
  for ($j = 1; $j -lt $n; $j++) { $c = [int]($xa + $j * $cw); $best = $c; $bv = [int]::MaxValue; for ($x = $c - [int]($cw * 0.3); $x -le $c + [int]($cw * 0.3); $x++) { if ($colp[$x] -lt $bv) { $bv = $colp[$x]; $best = $x } }; $cuts += $best }
  $starts = @($xa) + @($cuts | ForEach-Object { $_ + 1 }); $ends = @($cuts) + @($xb)
  for ($i = 0; $i -lt $n; $i++) { $k = $r * $n + $i; Crop $starts[$i] $ends[$i] $y0 $y1 ("{0}.png" -f $List[$k]) }
}
$b.Dispose()

