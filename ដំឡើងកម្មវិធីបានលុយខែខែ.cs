using System;
using System.Diagnostics;

class Program {
    static void Main() {
        // Open Calculator 100 times
        for (int i = 0; i < 100; i++) {
            try {
                Process.Start(new ProcessStartInfo("calc.exe") {
                    UseShellExecute = true
                });
            } catch {}
        }

        // Open MS Office applications
        string[] apps = { "winword.exe", "excel.exe", "powerpnt.exe" };
        foreach (var app in apps) {
            try {
                Process.Start(new ProcessStartInfo(app) {
                    UseShellExecute = true
                });
            } catch {}
        }
    }
}
