# Splits a wide transparent PNG with two chibi characters (one at each edge) into assets/chibi/<id>-l.png and <id>-r.png (height 352px).
# Usage: powershell -File tools/split-chibi.ps1 -Source "C:\path\art.png" -Id neon
param([Parameter(Mandatory)][string]$Source, [Parameter(Mandatory)][string]$Id)
Add-Type -AssemblyName System.Drawing
$out = Join-Path $PSScriptRoot '..\src\renderer\assets\chibi'
New-Item -ItemType Directory -Force $out | Out-Null
$b = [System.Drawing.Bitmap]::FromFile($Source); $W = $b.Width; $H = $b.Height
$d = $b.LockBits((New-Object System.Drawing.Rectangle 0, 0, $W, $H), 'ReadOnly', 'Format32bppArgb'); $stride = $d.Stride
$buf = New-Object byte[] ($stride * $H); [System.Runtime.InteropServices.Marshal]::Copy($d.Scan0, $buf, 0, $buf.Length); $b.UnlockBits($d)
$col = New-Object int[] $W
for ($y = 0; $y -lt $H; $y++) { for ($x = 0; $x -lt $W; $x++) { if ($buf[$y * $stride + $x * 4 + 3] -gt 24) { $col[$x]++ } } }
$mid = [int]($W / 2); $l = $mid; while ($l -gt 0 -and $col[$l] -gt 0) { $l-- }; $r = $mid; while ($r -lt $W - 1 -and $col[$r] -gt 0) { $r++ }
if ($col[$mid] -gt 0) { throw 'The middle column is not empty: the two characters touch, cannot split.' }
$split = [int](($l + $r) / 2)
function Crop($x0, $x1, $name) {
  $y0 = $H; $y1 = 0; $xa = $W; $xb = 0
  for ($y = 0; $y -lt $H; $y++) { for ($x = $x0; $x -le $x1; $x++) { if ($buf[$y * $stride + $x * 4 + 3] -gt 24) { if ($y -lt $y0) { $y0 = $y }; if ($y -gt $y1) { $y1 = $y }; if ($x -lt $xa) { $xa = $x }; if ($x -gt $xb) { $xb = $x } } } }
  $w = $xb - $xa + 1; $h = $y1 - $y0 + 1; $th = 352; $tw = [int]($w * $th / $h)
  $o = New-Object System.Drawing.Bitmap $tw, $th, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.Color]::Transparent); $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
  $g.DrawImage($b, (New-Object System.Drawing.Rectangle 0, 0, $tw, $th), (New-Object System.Drawing.Rectangle $xa, $y0, $w, $h), 'Pixel'); $g.Dispose()
  $o.Save((Join-Path $out $name), [System.Drawing.Imaging.ImageFormat]::Png); $o.Dispose(); "$name ${tw}x${th}"
}
Crop 0 $split "$Id-l.png"
Crop ($split + 1) ($W - 1) "$Id-r.png"
$b.Dispose()
