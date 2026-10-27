!define RECREATE_DESKTOP_SHORTCUT

!macro customInit
  ; Preserve DB from old installation dir to AppData ONLY if AppData DB doesn't exist
  IfFileExists "$APPDATA\work-manager-pro\db.json" skipBackup
  IfFileExists "$INSTDIR\db.json" 0 skipBackup
    CreateDirectory "$APPDATA\work-manager-pro"
    CopyFiles /SILENT "$INSTDIR\db.json" "$APPDATA\work-manager-pro\db.json"
  skipBackup:
!macroend

!macro customInstall
  File "/oname=$INSTDIR\app.ico" "D:\work-manager-pro\build\icon.ico"
  
  Delete "$DESKTOP\Work Manager Pro.lnk"
  CreateShortCut "$DESKTOP\Work Manager Pro.lnk" "$INSTDIR\Work Manager Pro.exe" "" "$INSTDIR\app.ico" 0 "" "" "Work Manager Pro"
  WinShell::SetLnkAUMI "$DESKTOP\Work Manager Pro.lnk" "com.workmanager.pro"

  Delete "$SMPROGRAMS\Work Manager Pro.lnk"
  CreateShortCut "$SMPROGRAMS\Work Manager Pro.lnk" "$INSTDIR\Work Manager Pro.exe" "" "$INSTDIR\app.ico" 0 "" "" "Work Manager Pro"
  WinShell::SetLnkAUMI "$SMPROGRAMS\Work Manager Pro.lnk" "com.workmanager.pro"

  System::Call 'Shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend

!macro customUnInstall
  Delete "$INSTDIR\app.ico"
  Delete "$DESKTOP\Work Manager Pro.lnk"
  Delete "$SMPROGRAMS\Work Manager Pro.lnk"
  System::Call 'Shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend
