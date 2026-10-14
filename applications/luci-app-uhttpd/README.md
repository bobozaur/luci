# uHTTPd configuration and certificate actions

The form edits the existing `uhttpd` UCI package. Listener and authentication
policy remain owned by uHTTPd and the normal UCI Save & Apply workflow.

The document root is required and remains explicit when it is `/www`: omitting
it makes uHTTPd use its working directory, which can make the CGI application
unreachable. Optional value suggestions use the native backend's placeholders
without deleting matching explicit values on Save. Existing Lua prefix/handler
lists retain their list representation; legacy scalar prefixes and their
separate handler remain supported.

Readers can inspect configuration and file metadata for the certificate picker.
This application grants them no file-content reads or service restart command.
Writers can upload under `/etc/luci-uploads`, remove files covered by their write
permissions, and execute the exact native `service.event` request for the
`uhttpd` package's `config.change` trigger through `/bin/ubus`. The native
`file.remove` and `file.exec` transport permissions accompany those resource rules;
the application does not grant arbitrary service events or commands.
Custom certificate locations require corresponding administrator permissions;
the application does not grant arbitrary filesystem writes.

Certificate buttons act on their own uHTTPd section, including non-main instances.
Replacement refuses unsaved form edits or saved pending `uhttpd` changes before
deleting anything. A failed pending-change query also stops the action. After
that check, it fetches the instance's certificate/key paths again and queues the
existing procd reload trigger using the applied service configuration. Apply or
discard changes first. PID1 owns the reload, so replacing the HTTPS listener does
not interrupt the action's RPC reply. An accepted request means the reload was
queued; it does not prove certificate generation or TLS connection success. The
page waits for the service to become reachable again using LuCI's normal reconnect
flow.
Missing files permit a retry; other removal errors and command failures are
reported without an unconditional page reload hiding the result.

Reset deletes the configured files immediately and saves pending removal of that
instance's certificate, key and HTTPS listeners. Before deleting files, it requires
an HTTP listener in that instance's current form values; a listener added in the
same form is sufficient. This guard runs before parsing changes the local UCI
cursor, so rejection leaves the form available for correction and retry.
An HTTPS-only instance must have an HTTP listener configured first. The action
does not invent a replacement listener.
Save & Apply remains the owner
that activates the changed configuration. A premature restart would read the old
configuration and could regenerate the deleted files. Removing files is permanent
and cannot be undone by UCI rollback. Other form edits are saved with the form;
the action does not automatically apply unrelated pending configuration.
