Add-Type -AssemblyName System.Drawing

$srcPath = "C:/Users/Admin/.gemini/antigravity/brain/dfae2a32-8780-4b37-8a40-b89306ea0260/.user_uploaded/media_1793346324627_6a8f0f03.png"
$outIcoPath = "d:\work-manager-pro\build\icon.ico"
$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function Get-DIB-Data($sz, $src) {
    $bmp = New-Object System.Drawing.Bitmap($sz, $sz, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($src, 0, 0, $sz, $sz)
    $g.Dispose()

    # Lock bits to get BGRA bytes
    $rect = New-Object System.Drawing.Rectangle(0, 0, $sz, $sz)
    $bmpData = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $stride = $bmpData.Stride
    $totalBytes = [Math]::Abs($stride) * $sz
    $rawPixels = New-Object byte[] $totalBytes
    [System.Runtime.InteropServices.Marshal]::Copy($bmpData.Scan0, $rawPixels, 0, $totalBytes)
    $bmp.UnlockBits($bmpData)
    $bmp.Dispose()

    # DIB is stored bottom-to-top
    $andMaskRowBytes = [int][Math]::Ceiling($sz / 32.0) * 4
    $andMaskSize = $andMaskRowBytes * $sz
    $colorSize = $sz * $sz * 4
    $dibHeaderSize = 40
    $totalDIBSize = $dibHeaderSize + $colorSize + $andMaskSize

    $ms = New-Object System.IO.MemoryStream($totalDIBSize)
    $bw = New-Object System.IO.BinaryWriter($ms)

    # BITMAPINFOHEADER
    $bw.Write([uint32]40)          # biSize
    $bw.Write([int32]$sz)          # biWidth
    $bw.Write([int32]($sz * 2))    # biHeight (doubled for XOR + AND mask)
    $bw.Write([uint16]1)           # biPlanes
    $bw.Write([uint16]32)          # biBitCount
    $bw.Write([uint32]0)           # biCompression (BI_RGB)
    $bw.Write([uint32]($colorSize + $andMaskSize)) # biSizeImage
    $bw.Write([int32]0)            # biXPelsPerMeter
    $bw.Write([int32]0)            # biYPelsPerMeter
    $bw.Write([uint32]0)           # biClrUsed
    $bw.Write([uint32]0)           # biClrImportant

    # Write pixels Bottom to Top
    for ($y = $sz - 1; $y -ge 0; $y--) {
        $rowOffset = $y * $stride
        $bw.Write($rawPixels, $rowOffset, $sz * 4)
    }

    # Write AND mask (all 0 for 32-bit alpha)
    $zeroMask = New-Object byte[] $andMaskSize
    $bw.Write($zeroMask, 0, $andMaskSize)

    $bytes = $ms.ToArray()
    $bw.Close()
    $ms.Close()
    return $bytes
}

function Get-PNG-Data($sz, $src) {
    $bmp = New-Object System.Drawing.Bitmap($sz, $sz, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($src, 0, 0, $sz, $sz)
    $g.Dispose()

    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $bytes = $ms.ToArray()
    $ms.Close()
    return $bytes
}

# Standard Windows icon sizes in recommended order (largest to smallest)
$entries = @()

# 256x256 as PNG
$png256 = Get-PNG-Data 256 $srcImg
$entries += ,@(256, $png256)

# 128, 64, 48, 32, 24, 16 as standard Windows DIB bitmaps
foreach ($sz in @(128, 64, 48, 32, 24, 16)) {
    $dib = Get-DIB-Data $sz $srcImg
    $entries += ,@($sz, $dib)
}

$srcImg.Dispose()

# Assemble ICO file
$fs = [System.IO.File]::Create($outIcoPath)
$bw = New-Object System.IO.BinaryWriter($fs)

# ICONDIR
$bw.Write([uint16]0) # Reserved
$bw.Write([uint16]1) # Type = 1 (Icon)
$bw.Write([uint16]$entries.Count)

$offset = 6 + (16 * $entries.Count)

foreach ($entry in $entries) {
    $sz = $entry[0]
    $data = $entry[1]
    $w = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }
    $h = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }
    $bw.Write([byte]$w)
    $bw.Write([byte]$h)
    $bw.Write([byte]0)   # ColorCount
    $bw.Write([byte]0)   # Reserved
    $bw.Write([uint16]1) # Planes
    $bw.Write([uint16]32) # BitCount
    $bw.Write([uint32]$data.Length)
    $bw.Write([uint32]$offset)
    $offset += $data.Length
}

foreach ($entry in $entries) {
    [byte[]]$bData = $entry[1]
    $bw.Write($bData, 0, $bData.Length)
}

$bw.Flush()
$fs.Close()
Write-Host "Created perfect Windows ICO! Size: " (Get-Item $outIcoPath).Length

