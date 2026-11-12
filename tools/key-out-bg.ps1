# Removes a flat background from a character sheet: flood-fills from the image border over pixels close to the border color and makes them transparent
# (plus a thin fringe so no light halo remains on a dark UI). Characters keep their own inner fills because the flood stops at their outlines.
# Usage: powershell -File tools/key-out-bg.ps1 -Source "C:\path\sheet.png" -Out "C:\path\sheet-keyed.png" [-Tol 40] [-Fringe 2]
param([Parameter(Mandatory)][string]$Source, [Parameter(Mandatory)][string]$Out, [int]$Tol = 40, [int]$Fringe = 2)
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
public static class Key {
  static int D(byte[] b, int i, int r, int g, int bl) { int dr = b[i + 2] - r, dg = b[i + 1] - g, db = b[i] - bl; return System.Math.Abs(dr) + System.Math.Abs(dg) + System.Math.Abs(db); }
  public static void Run(byte[] b, int stride, int w, int h, int tol, int fringe) {
    // background color = average of the four corner pixels
    int[] cx = { 0, w - 1, 0, w - 1 }, cy = { 0, 0, h - 1, h - 1 }; int R = 0, G = 0, B = 0;
    for (int k = 0; k < 4; k++) { int i = cy[k] * stride + cx[k] * 4; B += b[i]; G += b[i + 1]; R += b[i + 2]; }
    R /= 4; G /= 4; B /= 4;
    var seen = new bool[w * h]; var q = new System.Collections.Generic.Queue<int>();
    for (int x = 0; x < w; x++) { q.Enqueue(x); q.Enqueue((h - 1) * w + x); }
    for (int y = 0; y < h; y++) { q.Enqueue(y * w); q.Enqueue(y * w + w - 1); }
    while (q.Count > 0) {
      int p = q.Dequeue(); if (seen[p]) continue; int x = p % w, y = p / w; int i = y * stride + x * 4;
      if (D(b, i, R, G, B) > tol * 3) continue;
      seen[p] = true; b[i + 3] = 0;
      if (x > 0) q.Enqueue(p - 1); if (x < w - 1) q.Enqueue(p + 1); if (y > 0) q.Enqueue(p - w); if (y < h - 1) q.Enqueue(p + w);
    }
    // fringe: pixels touching the removed area that still look like the background get removed too (anti-aliased edge mix)
    for (int pass = 0; pass < fringe; pass++) {
      var kill = new System.Collections.Generic.List<int>();
      for (int y = 1; y < h - 1; y++) for (int x = 1; x < w - 1; x++) {
        int i = y * stride + x * 4; if (b[i + 3] == 0) continue;
        bool near = b[i - 4 + 3] == 0 || b[i + 4 + 3] == 0 || b[i - stride + 3] == 0 || b[i + stride + 3] == 0;
        if (near && D(b, i, R, G, B) < tol * 6) kill.Add(i);
      }
      foreach (int i in kill) b[i + 3] = 0;
    }
  }
}
'@
$src = [System.Drawing.Bitmap]::FromFile($Source); $w = $src.Width; $h = $src.Height
# the file may load as 24-bit (no alpha); draw it into a 32-bit ARGB bitmap so transparency can be saved
$bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gr = [System.Drawing.Graphics]::FromImage($bmp); $gr.DrawImage($src, 0, 0, $w, $h); $gr.Dispose(); $src.Dispose()
$d = $bmp.LockBits((New-Object System.Drawing.Rectangle 0, 0, $w, $h), 'ReadWrite', 'Format32bppArgb'); $stride = $d.Stride
$buf = New-Object byte[] ($stride * $h); [System.Runtime.InteropServices.Marshal]::Copy($d.Scan0, $buf, 0, $buf.Length)
[Key]::Run($buf, $stride, $w, $h, $Tol, $Fringe)
[System.Runtime.InteropServices.Marshal]::Copy($buf, 0, $d.Scan0, $buf.Length); $bmp.UnlockBits($d)
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose(); "saved $Out"
