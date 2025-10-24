tell application "System Events"
    set frontmostProcess to first process whose frontmost is true
    set appName to name of frontmostProcess
end tell

if appName is equal to "Langra" then
    return
end if

tell application "System Events"
    keystroke (ASCII character 8)
    delay 0.05
    keystroke "v" using {command down}
end tell
