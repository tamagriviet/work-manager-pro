Add-Type -AssemblyName System.Drawing

$srcPath = "C:/Users/Admin/.gemini/antigravity/brain/29fb37f2-09cd-477f-bd45-2440ab025c41/.user_uploaded/media_1793062556521_214ee8b6.png"
$outIcoPath = "d:\work-manager-pro\build\icon.ico"
$outPngPath = "d:\work-manager-pro\build\icon.png"

# Copy high-res png to build and public
Copy-Item $srcPath $outPngPath -Force
if (-not (Test-Path "d:\work-manager-pro\public")) {
    New-Item -ItemType Directory -Path "d:\work-manager-pro\public" | Out-Null
}
Copy-Item $srcPath "d:\work-manager-pro\public\icon.png" -Force

$srcImg = [System.Drawing.Image]::FromFile($srcPath)
$sizes = @(256, 128, 64, 48, 32, 16)
$pngBytesList = @()

foreach ($sz in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($sz, $sz)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($srcImg, 0, 0, $sz, $sz)
    $g.Dispose()

    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $pngBytesList += ,@($sz, $ms.ToArray())
    $ms.Dispose()
}
$srcImg.Dispose()

$fs = [System.IO.File]::Create($outIcoPath)
$bw = New-Object System.IO.BinaryWriter($fs)

# ICONDIR header: 6 bytes
$bw.Write([uint16]0) # Reserved
$bw.Write([uint16]1) # Type: 1 = ICO
$bw.Write([uint16]$pngBytesList.Count) # Count of images

$offset = 6 + (16 * $pngBytesList.Count)

foreach ($item in $pngBytesList) {
    $sz = $item[0]
    $data = $item[1]
    $w = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }
    $h = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }
    $bw.Write([byte]$w)
    $bw.Write([byte]$h)
    $bw.Write([byte]0) # Color palette count
    $bw.Write([byte]0) # Reserved
    $bw.Write([uint16]1) # Color planes
    $bw.Write([uint16]32) # Bits per pixel
    $bw.Write([uint32]$data.Length)
    $bw.Write([uint32]$offset)
    $offset += $data.Length
}

foreach ($item in $pngBytesList) {
    $bw.Write($item[1])
}

$bw.Flush()
$fs.Close()
Write-Host "Generated icon.ico successfully! Size:" (Get-Item $outIcoPath).Length
