'use strict';
'require view';
'require form';
'require uci';

return view.extend({
	render: function() {
		let m = new form.Map('xl2tp', _('L2TP Servers'),
			_('Applying changes restarts the shared L2TP service and reconnects active L2TP clients. Configure outgoing clients under Network → Interfaces using the L2TP protocol. L2TP does not encrypt traffic; configure IPsec and firewall access separately.'));
		let s = m.section(form.TypedSection, 'global', _('Service'));
		s.anonymous = true;
		let o = s.option(form.Flag, 'use_legacy_config', _('Use existing configuration files'),
			_('When enabled, the service reads its existing files in /etc/xl2tpd. Disable this to apply the servers and users below.'));
		o.default = '1';
		o.rmempty = false;
		o = s.option(form.Value, 'port', _('Listening port'));
		o.datatype = 'port';
		o.placeholder = '1701';
		o = s.option(form.Value, 'listen_addr', _('Listening address'));
		o.datatype = 'ip4addr';
		o.placeholder = '0.0.0.0';

		s = m.section(form.GridSection, 'lns', _('Servers'),
			_('Name the fallback server default. Other server names require allowed-client address ranges. Names are case-insensitive.'));
		s.addremove = true;
		s.nodescriptions = true;
		s.tab('general', _('General'));
		s.tab('ppp', _('PPP'));
		o = s.taboption('general', form.Flag, 'enabled', _('Enabled'));
		o.default = '1';
		o.rmempty = false;
		o = s.taboption('general', form.Value, 'local_ip', _('Local IPv4 address'));
		o.datatype = 'ip4addr';
		o.rmempty = false;
		o = s.taboption('general', form.DynamicList, 'ip_range', _('Client address pool'));
		o.datatype = 'or(ip4addr,iprange4)';
		o.placeholder = '192.168.254.202-192.168.254.210';
		o.rmempty = false;
		o = s.taboption('general', form.DynamicList, 'lac', _('Allowed client addresses'),
			_('Source addresses or ranges that select this server. Required for a named server other than default.'));
		o.datatype = 'or(ip4addr,iprange4)';
		o.modalonly = true;
		o = s.taboption('general', form.Flag, 'exclusive', _('Exclusive tunnel'));
		o.modalonly = true;
		o = s.taboption('general', form.Flag, 'length_bit', _('Include payload length'));
		o.default = '1';
		o.modalonly = true;

		o = s.taboption('ppp', form.ListValue, 'ppp_auth', _('PPP authentication'));
		o.value('', _('Existing PPP options file'));
		o.value('mschap-v2', 'MS-CHAPv2');
		o.value('chap', 'CHAP');
		o.value('pap', 'PAP');
		o.modalonly = true;
		o = s.taboption('ppp', form.Value, 'pppoptfile', _('PPP options file'));
		o.datatype = 'file';
		o.depends('ppp_auth', '');
		o.modalonly = true;
		o = s.taboption('ppp', form.Value, 'ppp_ifname', _('Interface prefix'),
			_('Use a unique prefix of up to 7 letters, digits or underscores. Each connected client has its own interface. Add this prefix followed by + to the intended firewall zone; no access rules are created automatically.'));
		for (let auth of [ 'pap', 'chap', 'mschap-v2' ])
			o.depends('ppp_auth', auth);
		o.rmempty = false;
		o.modalonly = true;
		o.validate = function(section_id, value) {
			if (!/^[A-Za-z0-9_]{1,7}$/.test(value))
				return _('Use 1–7 letters, digits or underscores.');
			for (let other of uci.sections('xl2tp', 'lns')) {
				if (other['.name'] == section_id)
					continue;
				let prefix = this.map.lookupOption('ppp_ifname', other['.name'])[0]?.formvalue(other['.name']);
				if (prefix && (prefix.startsWith(value) || value.startsWith(prefix)))
					return _('Server interface prefixes must not overlap.');
			}
			return true;
		};
		for (let field of [ 'ppp_mtu', 'ppp_mru' ]) {
			o = s.taboption('ppp', form.Value, field, field == 'ppp_mtu' ? _('MTU') : _('MRU'));
			o.datatype = 'and(uinteger,range(128,65535))';
			o.placeholder = '1400';
			o.modalonly = true;
		}
		o = s.taboption('ppp', form.DynamicList, 'ppp_dns', _('DNS servers'));
		o.datatype = 'ip4addr';
		o.modalonly = true;
		o = s.taboption('ppp', form.Flag, 'ppp_ipv6', _('Negotiate IPv6'));
		o.modalonly = true;

		s = m.section(form.GridSection, 'user', _('PPP users'),
			_('Users are scoped to one server with managed PPP authentication.'));
		s.addremove = true;
		s.anonymous = true;
		o = s.option(form.Flag, 'enabled', _('Enabled'));
		o.default = '1';
		o.rmempty = false;
		o = s.option(form.ListValue, 'lns', _('Server'));
		o.rmempty = false;
		o.load = function(section_id) {
			this.keylist = []; this.vallist = [];
			for (let server of uci.sections('xl2tp', 'lns'))
				this.value(server['.name']);
			return this.super('load', [ section_id ]);
		};
		o = s.option(form.Value, 'username', _('Username'));
		o.rmempty = false;
		o.validate = function(section_id, value) {
			return value && value != '*' && !/[\x00-\x1f\x7f]/.test(value) || _('Enter a literal username without control characters.');
		};
		o = s.option(form.Value, 'password', _('Password'));
		o.password = true;
		o.rmempty = false;
		o.validate = function(section_id, value) {
			return value && value != '@login' && !value.startsWith('@/') && !/[\x00-\x1f\x7f]/.test(value) || _('Enter a password without control characters or PPP file/login references.');
		};
		return m.render();
	}
});
