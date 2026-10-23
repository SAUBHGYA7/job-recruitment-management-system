# JRMS Oracle JDBC Client Runner
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$ScriptDir\jdbc-client"

mvn exec:java "-Dexec.mainClass=com.jrms.jdbc.Main" "-Dexec.args=$args" -q
