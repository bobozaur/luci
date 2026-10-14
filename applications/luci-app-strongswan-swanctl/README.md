# strongSwan configuration and control

The form writes the native `ipsec` UCI configuration. Its ucitrack entry routes
Save & Apply to `swanctl`, including when the service was disabled when installed.
Service startup remains the administrator's policy; this package does not enable
it. The tunnel request ID maps directly to the backend: absent or zero requests
automatic allocation, while a nonzero value fixes the kernel policy request ID.

The application ACL grants `file.exec` transport as well as the exact swanmon
read commands. Only writers receive the four swanctl initiation/termination
command permissions. Read-only views retain status/details and disable control;
handlers also check write permission. RPC and command exit failures are reported.
Reading `network` is required to list existing XFRM interface IDs, but the form
only writes `ipsec`.
