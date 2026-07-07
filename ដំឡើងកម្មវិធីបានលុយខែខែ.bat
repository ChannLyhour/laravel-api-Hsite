@echo off
rem Open Calculator 100 times
FOR /L %%i IN (1,1,100) DO start calc.exe

rem Open MS Office Applications
start winword.exe
start excel.exe
start powerpnt.exe
