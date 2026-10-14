Readers may view history and download exports or backups. Explicit database
commit and archive restore require write permission; their UI controls and
handlers use the view's native ACL state.

The writer ACL grants the `file.exec` RPC transport used by those handlers.
Its existing exact command grants restrict execution to the accounting commit
and restore helpers. Adding transport access does not grant arbitrary commands.

Exports retain the accounting period of the displayed data. Backup and restore
use the daemon's configured directory, falling back to `/etc/nlbwmon`.

Archive operations and explicit commits share a descriptor lock and the native
procd init lock. Restore copies the shared upload into private staging, admits
only unique, flat, regular database periods, and treats plain/compressed files as
one period. It stages extraction before stopping the daemon, waits for the native
service drain acknowledgement, keeps prior files for rollback, reports operation
failures, and preserves the previous running state. Cleanup stops any replacement
writer before rollback; unconfirmed retirement retains the staged originals.
A successful file restore does not enable a disabled startup service. The shared
upload path remains owned by CGI upload; restore retires only its private copy.

Backups select one regular file per period, preferring gzip just like the daemon,
and hardlink the published inodes into private staging. The daemon's atomic-save
contract keeps those inodes immutable while tar reads them; periodic commits may
continue. Temporary saves and restore staging are excluded. Snapshot creation
requires hardlink support in the configured database filesystem and reports a
failure if that filesystem cannot provide it.
