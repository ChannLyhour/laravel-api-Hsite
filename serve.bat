@echo off
echo Starting Laravel dev server with 100M upload limits...
echo.

REM Try WAMP PHP 8.5.0 path first
if exist "C:\wamp64\bin\php\php8.5.0\php.exe" (
    echo Using WAMP PHP 8.5.0
    "C:\wamp64\bin\php\php8.5.0\php.exe" -d post_max_size=100M -d upload_max_filesize=100M -d memory_limit=256M -d max_execution_time=300 -d max_input_time=300 artisan serve --host=0.0.0.0 --port=8000
    goto :end
)

REM Fallback: try any WAMP PHP version
for /d %%d in ("C:\wamp64\bin\php\php8.*") do (
    if exist "%%d\php.exe" (
        echo Using %%d\php.exe
        "%%d\php.exe" -d post_max_size=100M -d upload_max_filesize=100M -d memory_limit=256M -d max_execution_time=300 -d max_input_time=300 artisan serve --host=0.0.0.0 --port=8000
        goto :end
    )
)

REM Fallback: php in PATH
echo Trying php from PATH...
php -d post_max_size=100M -d upload_max_filesize=100M -d memory_limit=256M -d max_execution_time=300 -d max_input_time=300 artisan serve --host=0.0.0.0 --port=8000

:end
