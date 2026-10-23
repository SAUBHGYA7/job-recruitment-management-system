@echo off
setlocal
cd /d "%~dp0jdbc-client"

mvn exec:java -Dexec.mainClass="com.jrms.jdbc.Main" -Dexec.args="%*" -q
endlocal
