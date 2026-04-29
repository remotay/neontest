param(
  [Parameter(Mandatory = $true)]
  [string]$Output,

  [int]$Width = 1280,
  [int]$Height = 720
)

$ErrorActionPreference = 'Stop'

$homeDir = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE '.codex' }
$generatedRoot = Join-Path $homeDir 'generated_images'
$latest = Get-ChildItem -Path $generatedRoot -Recurse -File -Filter '*.png' |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $latest) {
  throw "No generated PNG found under $generatedRoot"
}

$dest = Resolve-Path -LiteralPath (Split-Path -Parent $Output) -ErrorAction SilentlyContinue
if (-not $dest) {
  New-Item -ItemType Directory -Path (Split-Path -Parent $Output) -Force | Out-Null
}

Add-Type -AssemblyName System.Drawing

$srcPath = $latest.FullName
$img = [System.Drawing.Image]::FromFile($srcPath)
$sourceW = $img.Width
$sourceH = $img.Height

try {
  if ($sourceW -eq $Width -and $sourceH -eq $Height) {
    $img.Dispose()
    Copy-Item -LiteralPath $srcPath -Destination $Output -Force
  } else {
    $targetRatio = [double]$Width / [double]$Height
    $sourceRatio = [double]$sourceW / [double]$sourceH

    if ($sourceRatio -gt $targetRatio) {
      $cropH = $sourceH
      $cropW = [int][Math]::Round($sourceH * $targetRatio)
      $cropX = [int][Math]::Floor(($sourceW - $cropW) / 2)
      $cropY = 0
    } else {
      $cropW = $sourceW
      $cropH = [int][Math]::Round($sourceW / $targetRatio)
      $cropX = 0
      $cropY = [int][Math]::Floor(($sourceH - $cropH) / 2)
    }

    $bmp = New-Object System.Drawing.Bitmap $Width, $Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    try {
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
      $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighSpeed
      $destRect = New-Object System.Drawing.Rectangle 0, 0, $Width, $Height
      $cropRect = New-Object System.Drawing.Rectangle $cropX, $cropY, $cropW, $cropH
      $graphics.DrawImage($img, $destRect, $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
    } finally {
      $graphics.Dispose()
      $img.Dispose()
    }

    try {
      $bmp.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $bmp.Dispose()
    }
  }
} finally {
  if ($img) {
    $img.Dispose()
  }
}

$final = [System.Drawing.Image]::FromFile($Output)
try {
  [PSCustomObject]@{
    Output = (Resolve-Path -LiteralPath $Output).Path
    Source = $srcPath
    SourceWidth = $sourceW
    SourceHeight = $sourceH
    FinalWidth = $final.Width
    FinalHeight = $final.Height
    Bytes = (Get-Item -LiteralPath $Output).Length
  } | ConvertTo-Json -Compress
} finally {
  $final.Dispose()
}
