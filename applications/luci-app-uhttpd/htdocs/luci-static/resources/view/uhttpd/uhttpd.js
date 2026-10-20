'use	strict';
'require	view';
'require	form';
'require	fs';
'require	uci';
'require ui';
'require rpc';

const callUhttpdChanges = rpc.declare({
	object: 'uci',
	method: 'changes',
	params: [ 'config' ],
	reject: true
});

function getCertificateFiles(cert, key) {
	return [ cert || '/etc/uhttpd.crt', key || '/etc/uhttpd.key' ];
}

function getAppliedCertificateFiles(map, section_id) {
	function checkForm() {
		const localChanges = [ 'creates', 'changes', 'deletes' ].some(function(kind) {
			return Object.keys(uci.state[kind].uhttpd || {}).length > 0;
		});
		if (localChanges || uci.state.reorder.uhttpd || map.findElement('[data-changed="true"]'))
			throw new Error(_('Apply or discard uHTTPd changes before replacing its certificate.'));
	}

	return Promise.resolve().then(function() {
		checkForm();
		return callUhttpdChanges('uhttpd');
	}).then(function(result) {
		if (!result || !Array.isArray(result.changes))
			throw new Error(_('Unable to determine pending uHTTPd changes.'));
		if (result.changes.length)
			throw new Error(_('Apply or discard uHTTPd changes before replacing its certificate.'));
		return uci.callLoad('uhttpd');
	}).then(function(config) {
		checkForm();
		const instance = config[section_id];
		if (!instance || instance['.type'] !== 'uhttpd')
			throw new Error(_('The applied uHTTPd instance is unavailable. Reload this page.'));
		return getCertificateFiles(instance.cert, instance.key);
	});
}

function removeCertificateFiles(paths) {
	return paths.reduce(function(promise, path) {
		return promise.then(function() {
			if (!path)
				return;
			return fs.remove(path).catch(function(error) {
				if (error.name !== 'NotFoundError')
					throw error;
			});
		});
	}, Promise.resolve());
}

return view.extend({
	load: function () {
		return Promise.all([uci.load('uhttpd')]);
	},

	render: function () {
		let m, s, o;

		var lhttp = null;
		var lhttps = null;
		var cert_file = null;
		var key_file = null;
		m = new form.Map('uhttpd', _('uHTTPd'), _('A lightweight single-threaded HTTP(S) server'));

		s = m.section(form.TypedSection, 'uhttpd');
		s.addremove = true;
		s.anonymous = false;

		s.tab('general', _('General Settings'));
		s.tab('server', _('Full Web Server Settings'), _('For settings primarily geared to serving more than the web UI'));
		s.tab('advanced', _('Advanced Settings'), _('Settings which are either rarely needed or which affect serving the WebUI'));

		lhttp = s.taboption('general', form.DynamicList, 'listen_http', _('HTTP listeners (address:port)'), _('Bind to specific interface:port (by specifying interface address)'));
		lhttp.datatype = 'list(ipaddrport(1))';

		lhttp.validate = function (section_id, value) {
			var have_https_listener = false;
			var have_http_listener = false;
			if (lhttp && lhttp.formvalue(section_id) && lhttp.formvalue(section_id).length > 0) {
				lhttp.formvalue(section_id).forEach(function (v) {
					if (v && v !== '') {
						have_http_listener = true;
						return false;
					}
				});
			}
			if (lhttps && lhttps.formvalue(section_id) && lhttps.formvalue(section_id).length > 0) {
				lhttps.formvalue(section_id).forEach(function (v) {
					if (v && v !== '') {
						have_https_listener = true;
						return false;
					}
				});
			}
			if (!(have_http_listener || have_https_listener)) {
				return [null, 'must listen on at least one address:port'];
			}
			return true;
		};

		lhttps = s.taboption('general', form.DynamicList, 'listen_https', _('HTTPS listener (address:port)'), _('Bind to specific interface:port (by specifying interface address)'));
		lhttps.datatype = 'list(ipaddrport(1))';

		lhttps.validate = function (section_id, value) {
			let have_https_listener = false;
			let have_http_listener = false;

			if (lhttps && lhttps.formvalue(section_id) && lhttps.formvalue(section_id).length > 0) {
				lhttps.formvalue(section_id).forEach(function (v) {
					if (v && v !== '') {
						have_https_listener = true;
						return false;
					}
				});
				if (have_https_listener && (!cert_file || !cert_file.formvalue(section_id) || cert_file.formvalue(section_id) === '')) {
					return [null, 'must have certificate when using https'];
				}
				if (have_https_listener && (!key_file || !key_file.formvalue(section_id) || key_file.formvalue(section_id) === '')) {
					return [null, 'must have key when using https'];
				}
			}

			if (lhttp && lhttp.formvalue(section_id) && lhttp.formvalue(section_id).length > 0) {
				lhttp.formvalue(section_id).forEach(function (v) {
					if (v && v !== '') {
						have_http_listener = true;
						return false;
					}
				});
			}

			if (!(have_http_listener || have_https_listener)) {
				return [null, 'must listen on at least one address:port'];
			}

			return true;
		};

		o = s.taboption('general', form.Flag, 'redirect_https', _('Redirect all HTTP to HTTPS'));
		o.default = o.enabled;
		o.rmempty = false;

		o = s.taboption('general', form.Flag, 'rfc1918_filter', _('Ignore private IPs on public interface'), _('Prevent access from private (RFC1918) IPs on an interface if it has an public IP address'));
		o.default = o.enabled;
		o.rmempty = false;

		cert_file = s.taboption('general', form.FileUpload, 'cert', _('HTTPS Certificate (DER or PEM format)'), _('Files can only be uploaded and saved to the /etc/luci-uploads directory.'));
		cert_file.root_directory = '/';
		cert_file.enable_remove = false;

		key_file = s.taboption('general', form.FileUpload, 'key', _('HTTPS Private Key (DER or PEM format)'), _('Files can only be uploaded and saved to the /etc/luci-uploads directory.'));
		key_file.root_directory = '/';
		key_file.enable_remove = false;

		o = s.taboption('general', form.Button, 'remove_old', _('Remove old certificate and key'), _('Permanently deletes this instance\'s applied certificate and key, then requests regeneration through the native uHTTPd reload handler. Apply or discard uHTTPd changes before using this action.'));
		o.inputstyle = 'remove';
		o.readonly = !L.hasViewPermission();
		o.onclick = function (ev, section_id) {
			if (!L.hasViewPermission())
				return Promise.reject(new Error(_('Permission denied.')));

			return getAppliedCertificateFiles(this.map, section_id)
				.then(removeCertificateFiles)
				// procd's existing package trigger acknowledges this event before
				// its queued reload replaces the listener carrying our RPC reply.
				.then(() => fs.exec('/bin/ubus', [ 'call', 'service', 'event', '{"type":"config.change","data":{"package":"uhttpd"}}' ]))
				.then(function(result) {
					if (result.code !== 0)
						throw new Error(result.stderr || result.stdout || _('Unable to request uHTTPd reload.'));
					ui.showModal(_('Reloading HTTPS configuration'), [
						E('p', { 'class': 'spinning' }, _('Certificate regeneration and reload are queued. Waiting to reconnect…'))
					]);
					ui.awaitReconnect();
				})
				.catch(function(error) {
					ui.addNotification(null, E('p', _('Unable to complete certificate replacement: %s').format(error.message)), 'error');
				});
		};

		o = s.taboption('general', form.Button, 'remove_conf', _('Remove configuration for certificate and key'), _('Permanently deletes this instance\'s configured certificate and key, then saves removal of its HTTPS settings. Use Save & Apply to activate the change. Deleted files are not restored by configuration rollback.'));
		o.inputstyle = 'remove';
		o.readonly = !L.hasViewPermission();
		o.onclick = function (ev, section_id) {
			if (!L.hasViewPermission())
				return Promise.reject(new Error(_('Permission denied.')));

			return Promise.resolve().then(() => {
				// Check the current widget before parsing mutates the local UCI
				// cursor, so a rejected reset can be retried in the same form.
				const listeners = L.toArray(lhttp.formvalue(section_id));
				if (!listeners.some(value => typeof(value) === 'string' && value.trim() !== ''))
					throw new Error(_('Configure an HTTP listener for this instance before removing its HTTPS configuration.'));

				return this.map.save(function() {
					return removeCertificateFiles(getCertificateFiles(uci.get('uhttpd', section_id, 'cert'), uci.get('uhttpd', section_id, 'key'))).then(function() {
						uci.unset('uhttpd', section_id, 'cert');
						uci.unset('uhttpd', section_id, 'key');
						uci.unset('uhttpd', section_id, 'listen_https');
					});
				}, true);
			})
				.then(function() {
					ui.addNotification(null, E('p', _('Certificate and key removed. Use Save & Apply to activate the saved HTTPS changes.')), 'info');
				})
				.catch(function(error) {
					ui.addNotification(null, E('p', _('Unable to complete certificate reset: %s').format(error.message)), 'error');
				});
		};

		o = s.taboption('server', form.DynamicList, 'index_page', _('Index page(s)'), _('E.g specify with index.html and index.php when using PHP'));
		o.optional = true;
		o.placeholder = 'index.html';

		o = s.taboption('server', form.DynamicList, 'interpreter', _('CGI filetype handler'), _("Interpreter to associate with file endings ('suffix=handler', e.g. '.php=/usr/bin/php-cgi')"));
		o.optional = true;

		o = s.taboption('server', form.Flag, 'no_symlinks', _('Do not follow symlinks outside document root'));
		o.optional = true;

		o = s.taboption('server', form.Flag, 'no_dirlists', _('Do not generate directory listings.'));
		o.default = o.disabled;

		o = s.taboption('server', form.DynamicList, 'alias', _('Aliases'), _('(/old/path=/new/path) or (just /old/path which becomes /cgi-prefix/old/path)'));
		o.optional = true;

		o = s.taboption('server', form.Value, 'realm', _('Realm for Basic Auth'));
		o.optional = true;
		o.placeholder = window.location.hostname || 'OpenWrt';

		o = s.taboption('server', form.Value, 'config', _('Config file (e.g. for credentials for Basic Auth)'), _('Will not use HTTP authentication if not present'));
		o.optional = true;

		o = s.taboption('server', form.Value, 'error_page', _('404 Error'), _("Virtual URL or CGI script to display on status '404 Not Found'. Must begin with '/'"));
		o.optional = true;

		o = s.taboption('advanced', form.Value, 'home', _('Document root'), _('Base directory for files to be served'));
		o.default = '/www';
		o.rmempty = false;
		o.datatype = 'directory';

		o = s.taboption('advanced', form.Value, 'cgi_prefix', _('Path prefix for CGI scripts'), _('CGI is disabled if not present.'));
		o.optional = true;

		o = s.taboption('advanced', form.Value, 'lua_prefix', _('Virtual path prefix for Lua scripts'), _('List entries use /url-prefix=/path/to/handler. Legacy scalar prefixes use the separate Lua handler below.'));
		o.placeholder = '/lua';
		o.optional = true;
		o.allowduplicates = true;
		o.renderWidget = function(section_id, option_index, cfgvalue) {
			// Preserve native prefix/handler lists and the legacy scalar form.
			// Both widgets expose their original value type through getValue().
			const widget = Array.isArray(cfgvalue) ? form.DynamicList : form.Value;
			return widget.prototype.renderWidget.call(this, section_id, option_index, cfgvalue);
		};

		o = s.taboption('advanced', form.Value, 'lua_handler', _('Full real path to handler for Lua scripts'), _('Used with a legacy scalar prefix. List entries specify their own handlers.'));
		o.optional = true;

		o = s.taboption('advanced', form.Value, 'ubus_prefix', _('Virtual path prefix for ubus via JSON-RPC integration'), _('ubus integration is disabled if not present'));
		o.optional = true;

		o = s.taboption('advanced', form.Value, 'ubus_socket', _('Override path for ubus socket'));
		o.optional = true;

		o = s.taboption('advanced', form.Flag, 'ubus_cors', _('Enable JSON-RPC Cross-Origin Resource Support'));
		o.default = o.disabled;
		o.optional = true;

		o = s.taboption('advanced', form.Flag, 'no_ubusauth', _('Disable JSON-RPC authorization via ubus session API'));
		o.optional = true;
		o.default = o.disabled;

		o = s.taboption('advanced', form.Value, 'script_timeout', _('Maximum wait time for Lua, CGI, or ubus execution'));
		o.placeholder = 60;
		o.datatype = 'uinteger';
		o.optional = true;

		o = s.taboption('advanced', form.Value, 'network_timeout', _('Maximum wait time for network activity'));
		o.placeholder = 30;
		o.datatype = 'uinteger';
		o.optional = true;

		o = s.taboption('advanced', form.Value, 'http_keepalive', _('Connection reuse'));
		o.placeholder = 20;
		o.datatype = 'uinteger';
		o.optional = true;

		o = s.taboption('advanced', form.Value, 'tcp_keepalive', _('TCP Keepalive'));
		o.optional = true;
		o.datatype = 'uinteger';
		o.placeholder = 0;

		o = s.taboption('advanced', form.Value, 'max_connections', _('Maximum number of connections'));
		o.optional = true;
		o.datatype = 'uinteger';

		o = s.taboption('advanced', form.Value, 'max_requests', _('Maximum number of script requests'));
		o.optional = true;
		o.datatype = 'uinteger';

		s = m.section(form.TypedSection, 'cert', _('uHTTPd Self-signed Certificate Parameters'));
		s.template = 'cbi/tsection';
		s.anonymous = true;

		o = s.option(form.Value, 'days', _('Valid for # of Days'));
		o.placeholder = 397;
		o.datatype = 'uinteger';

		o = s.option(form.Value, 'bits', _('Length of key in bits'));
		o.placeholder = 2048;
		o.datatype = 'min(1024)';

		o = s.option(form.Value, 'commonname', _('Server Hostname'), _('a.k.a CommonName'));
		o.placeholder = 'OpenWrt';

		o = s.option(form.Value, 'organization', _('Organization'), _('If empty, a random/unique value is used in cert generation'));

		o = s.option(form.Value, 'location', _('Location'));
		o.placeholder = 'Unknown';

		o = s.option(form.Value, 'state', _('State', 'Certificate state, region or province'));
		o.placeholder = 'Somewhere';

		o = s.option(form.Value, 'country', _('Country'));
		o.placeholder = 'ZZ';

		return m.render();
	},
});
