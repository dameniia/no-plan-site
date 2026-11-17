---
name: verify-deploy
description: Use after pushing to main, or when a Hostinger deploy was green but https://no-plan.app looks unchanged or wrong (e.g. shows WordPress). Checks the run log, FTP folder, CDN cache and live pages.
---

# Verify a Hostinger deploy (no-plan.app)

A green GitHub run does NOT mean the site changed. Check in this order:

1. **Run log** — `gh run view <id> --log | grep -E "Server Files|Local Files|first publish|Upload:|Error:"`
   - `Server Files: 0` / "first publish" when it isn't the first = wrong folder (`server-dir` must be `/public_html/` for this account).
   - `ECONNRESET (data socket)` = transient, `gh run rerun <id>`.
   - `530 Login incorrect` = wrong `FTP_USERNAME`/`FTP_PASSWORD` (username is `u103061112.no-plan.app`). `ENOTFOUND` = bad `FTP_SERVER` (bare IP, no `ftp://`).
2. **Secrets** — `cd /Users/andreidameniia/Developer/no-plan-site && gh secret list` (check timestamps; `gh` acts on the current repo).
3. **Origin vs CDN** — compare `curl -s "https://no-plan.app/?x=$RANDOM" | grep -o '<title>[^<]*'` (bypasses cache) with the plain URL. Plain shows WordPress/old page but `?x=` is right = stale CDN: purge in hPanel (Websites → no-plan.app → Performance → Cache Manager). `curl -sI https://no-plan.app/ | grep -iE "cache|age|x-hcdn"` shows `HIT`/age.
4. **Pages** — `/`, `/post`, `/images/noplan-icon.png` → 200; `https://adameniia.com/noplan` → 301 to https://no-plan.app/.

To inspect folders, use a throwaway branch with a read-only workflow running `curl --list-only ftp://…`, then delete the branch.
