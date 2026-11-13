# Safe Windows local development server

This repository's `pnpm dev` and `pnpm start` scripts bind Next.js to `127.0.0.1`. The private local URL is `http://127.0.0.1:3000`; E2E uses `http://127.0.0.1:3101`. Do not change the host to `0.0.0.0` or publish/forward these ports for shared access. Loopback binding does not add authentication and does not make this API safe for public or multi-user deployment.

Before starting a server, check both ports and inspect their owners:

```powershell
$listeners = Get-NetTCPConnection -LocalPort 3000,3101 -State Listen -ErrorAction SilentlyContinue
$listeners | Select-Object LocalAddress,LocalPort,OwningProcess
foreach ($listener in $listeners) {
  Get-CimInstance Win32_Process |
    Where-Object { $_.ProcessId -eq $listener.OwningProcess } |
    Select-Object ProcessId,ParentProcessId,Name,CommandLine
}
```

Stop a process only after its command line confirms it belongs to this repository. Prefer `Ctrl+C` in the owning VS Code terminal. If that terminal is gone, recheck the PID and stop only the verified process tree:

```powershell
$verifiedNextDevPid = 1234 # replace only after verifying the owning command line
taskkill.exe /PID $verifiedNextDevPid /T
```

Never use a broad `Stop-Process node` command. If another application owns a port, leave it running and choose an unused port for this app. Do not run two development servers for this workspace because they share `.next`.

Start from the project root:

```powershell
Set-Location D:\KoreanLearning
pnpm dev
```

Confirm the terminal reports `http://127.0.0.1:3000`. Normal startup does not require `pnpm db:setup`; routine setup/seed operations may change authored records. For database maintenance, stop the app and follow [DATABASE-SAFETY.md](./DATABASE-SAFETY.md).

If a verified workspace server fails and generated `.next` manifests disagree, stop that server first. Confirm `(Resolve-Path .next).Path` is exactly `D:\KoreanLearning\.next`, then rename the generated folder rather than deleting it:

```powershell
$resolvedNext = (Resolve-Path .next).Path
if ($resolvedNext -ne 'D:\KoreanLearning\.next') { throw "Unexpected .next path: $resolvedNext" }
Rename-Item -LiteralPath $resolvedNext -NewName ".next.stale-$(Get-Date -Format yyyyMMdd-HHmmss)"
pnpm dev
```

Keep the renamed build output until the fresh server works. Never rename or remove `data`, `data\korean.db`, or a backup during a server restart.
