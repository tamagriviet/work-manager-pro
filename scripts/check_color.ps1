Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile("d:\work-manager-pro\extracted_large.png")
for ($y = 0; $y -lt $bmp.Height; $y += 3) {
    $line = ""
    for ($x = 0; $x -lt $bmp.Width; $x += 2) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.A -lt 50) { $line += " " }
        elseif ($c.R -lt 50 -and $c.B -gt 150) { $line += "#" }
        else { $line += "." }
    }
    Write-Host $line
}
$cCenter = $bmp.GetPixel(16, 16)
Write-Host "Center pixel: R=$($cCenter.R), G=$($cCenter.G), B=$($cCenter.B), A=$($cCenter.A)"
$bmp.Dispose()
