param (
  [string]$Title = "DevFlow Timer",
  [string]$Message = "Sesi Pomodoro Selesai!"
)

try {
  [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
  [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
  
  $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
  $template = @"
<toast>
  <visual>
    <binding template="ToastGeneric">
      <text>$Title</text>
      <text>$Message</text>
    </binding>
  </visual>
  <audio src="ms-winsoundevent:Notification.Default" />
</toast>
"@
  $xml.LoadXml($template)
  $toast = New-Object Windows.UI.Notifications.ToastNotification $xml
  [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("DevFlow Timer").Show($toast)
} catch {
  try {
    [System.Media.SystemSounds]::Beep.Play()
  } catch {}
}
