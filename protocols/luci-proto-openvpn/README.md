# Configuration files and generated keys

The protocol form writes the native `network` UCI interface. Save & Apply leaves
service startup, interface state and routing with netifd and the OpenVPN protocol
handler. Reading an existing raw profile does not stage configuration changes;
unchanged content retains its original path and file bytes. Editing a raw profile
writes the managed `/etc/openvpn/<interface>/<interface>_config.cfg` file. Clearing
the field removes that managed file and its UCI reference, without deleting an
externally configured profile.

Readers can load profiles and inspect file metadata under `/etc/openvpn`, and
list existing server-key names. Key generation, profile-directory creation,
uploads, writes and removal require the protocol's write permission. Each file
operation has both its native RPC transport and bounded path permission. The
directory preparation method accepts a literal UCI interface name; it grants no
general command execution or directory creation outside the profile directory.

Generated keys use the existing native OpenVPN `--genkey` command. The backend
accepts only the form's finite key types and literal interface/key names, rejects
symlinks in managed directories and server-key files, refuses to overwrite an
existing output name, and checks command completion before returning a key. Keys
are mode 0600. Failed commands are reported by the form. A new interface with no
key directory has an empty server-key list; listing failures remain errors.

Certificate and key uploads are limited to `/etc/openvpn`. Paths for chroot,
certificate directories, password files and replay state remain ordinary text
values, preserving administrator-managed locations without granting file writes
throughout `/etc` or `/var/run`. Custom client configuration directories must
already exist; the picker can select them under `/etc/openvpn`. Custom profile
locations outside the permitted subtree require corresponding administrator ACLs.
Key-generation controls do not commit a key selection automatically.
