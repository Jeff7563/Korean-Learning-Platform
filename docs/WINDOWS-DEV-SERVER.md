# Safe Windows development server restart

Run these checks from `D:\KoreanLearning` before starting another Next.js server. The app uses port 3000 for development and port 3101 for isolated E2E. Do not stop a process until its command line confirms it belongs to this workspace.

```powershell
$listeners = Get-NetTCPConnection -LocalPort 3000,3101 -State Listen -ErrorAction SilentlyContinue
$listeners | Select-Object LocalAddress, LocalPort, OwningProcess
foreach ($listener in $listeners) {
  Get-CimInstance Win32_Process |
    Where-Object { $_.ProcessId -eq $listener.OwningProcess } |
    Select-Object ProcessId, ParentProcessId, Name, CommandLine
}
```

If the port owner is this repository's `next dev`, stop it with `Ctrl+C` in its VS Code terminal. If that terminal is gone, recheck the process ID and command line, then stop only that verified process tree:

```powershell
$verifiedNextDevPid = 1234 # replace only after confirming the command line above
taskkill.exe /PID $verifiedNextDevPid /T
```

Do not use a broad `Stop-Process node` command. If another application owns port 3000, leave it running; choose an unused port for this app instead. Do not run two dev servers for this workspace at the same time because they share `.next`.

Start the server from the repository root and confirm it reports the expected URL:

```powershell
Set-Location D:\KoreanLearning
pnpm dev
```

If the same verified workspace server still fails and its `.next` route manifest disagrees with compiled route files, first stop the server. Confirm `(Resolve-Path .next).Path` is exactly `D:\KoreanLearning\.next`, then rename that generated directory instead of deleting it:

```powershell
$resolvedNext = (Resolve-Path .next).Path
if ($resolvedNext -ne 'D:\KoreanLearning\.next') { throw "Unexpected .next path: $resolvedNext" }
Rename-Item -LiteralPath $resolvedNext -NewName ".next.stale-$(Get-Date -Format yyyyMMdd-HHmmss)"
pnpm dev
```

Next.js will recreate `.next`. Keep the renamed directory until the fresh server is verified, then remove only that specific stale build directory if desired. Never rename or remove `data`, `data\korean.db`, or database backups as part of a server restart.
