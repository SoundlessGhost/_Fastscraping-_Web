# Fastscraping — server scripts

`backup.sh` runs nightly at 02:30 UTC from root's crontab on 89.117.59.90 and
writes to /opt/Fastscraping/backups (bayna's own backup runs at 23:30 — leave
that entry alone).

`verify-restore.sh` proves the newest dump restores, by loading it into a
scratch database and comparing row counts to live. Run it after any change to
the schema or the backup itself. A dump nobody has restored is not a backup.

Restore for real:

    docker exec -i fs-db pg_restore -U fastscraping -d fastscraping --clean \\
      --if-exists < /opt/Fastscraping/backups/<file>.dump
