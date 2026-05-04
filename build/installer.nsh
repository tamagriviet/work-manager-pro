!macro customInit
  ; Preserve DB from old installation dir to AppData ONLY if AppData DB doesn't exist
  IfFileExists "$APPDATA\work-manager-pro\db.json" skipBackup
  IfFileExists "$INSTDIR\db.json" 0 skipBackup
    CreateDirectory "$APPDATA\work-manager-pro"
    CopyFiles /SILENT "$INSTDIR\db.json" "$APPDATA\work-manager-pro\db.json"
  skipBackup:
!macroend
