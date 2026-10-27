Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class IconTester {
    [DllImport("shell32.dll", CharSet = CharSet.Auto)]
    public static extern int ExtractIconEx(string stExeFileName, int nIconIndex, IntPtr[] phiconLarge, IntPtr[] phiconSmall, int nIcons);
}
'@

$large = New-Object IntPtr[] 1
$small = New-Object IntPtr[] 1
$ret = [IconTester]::ExtractIconEx('d:\work-manager-pro\dist-electron\win-unpacked\Work Manager Pro.exe', 0, $large, $small, 1)
Write-Host "ExtractIconEx returned count: $ret"
Write-Host "Large icon handle: $($large[0])"
Write-Host "Small icon handle: $($small[0])"

if ($large[0] -ne [IntPtr]::Zero) {
    $ico = [System.Drawing.Icon]::FromHandle($large[0])
    $bmp = $ico.ToBitmap()
    $bmp.Save('d:\work-manager-pro\extracted_large.png', [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Saved extracted_large.png successfully! Size: $($bmp.Width) x $($bmp.Height)"
}
if ($small[0] -ne [IntPtr]::Zero) {
    $ico2 = [System.Drawing.Icon]::FromHandle($small[0])
    $bmp2 = $ico2.ToBitmap()
    $bmp2.Save('d:\work-manager-pro\extracted_small.png', [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Saved extracted_small.png successfully! Size: $($bmp2.Width) x $($bmp2.Height)"
}
