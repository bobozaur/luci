'use strict';
'require view';
'require uci';
'require form';
'require tools.widgets as widgets';

function protocols(value) {
	return L.toArray(value || 'tcpudp').join(' ').replace(/tcpudp/g, 'tcp udp').split(/\s+/);
}

function ports(value) {
	const match = String(value || '').match(/^(\d+)(?:[-:](\d+))?$/);
	return match ? [ +match[1], +(match[2] || match[1]) ] : null;
}

return view.extend({
	load() {
		return uci.load('firewall');
	},

	render() {
		const m = new form.Map('firewall', _('Firewall - Port Triggers'),
			_('A matching outbound connection temporarily forwards incoming IPv4 ports to the first device that uses the trigger. Only that device’s outbound trigger traffic renews the timeout. Firewall reloads and network disconnections clear the lease; established connections may continue.'));
		const s = m.section(form.GridSection, 'port_trigger', _('Port Triggers'));
		s.anonymous = true;
		s.addremove = true;
		s.cloneable = true;
		s.sectiontitle = section => uci.get('firewall', section, 'name') || _('Unnamed trigger');

		const value = (context, section, key) => {
			// A dialog saves its own map, not unsaved edits in the parent grid.
			// An absent Flag widget must fall back to UCI rather than read as off.
			const option = context.section.getOption(key);
			if (option && option.getUIElement(section))
				return option.formvalue(section);
			const configured = uci.get('firewall', section, key);
			return configured != null ? configured : option?.default;
		};

		const allocation = (context, section, input) => {
			const range = ports(input);
			if (!range || range[0] < 1 || range[1] > 65535 || range[0] > range[1])
				return _('Enter a port or range from 1 to 65535.');
			const wan = value(context, section, 'dest');
			const proto = protocols(value(context, section, 'open_proto'));
			for (const other of uci.sections('firewall')) {
				const trigger = other['.type'] == 'port_trigger';
				if (other['.name'] == section || (trigger ? value(context, other['.name'], 'enabled') : other.enabled) == '0')
					continue;
				const forward = other['.type'] == 'redirect' && (other.target || 'DNAT').toUpperCase() == 'DNAT';
				if ((!trigger && !forward) || (trigger ? value(context, other['.name'], 'dest') : other.src) != wan || other.family == 'ipv6')
					continue;
				const otherRange = ports(trigger ? value(context, other['.name'], 'open_port') : other.src_dport);
				const otherProto = protocols(trigger ? value(context, other['.name'], 'open_proto') : other.proto);
				if (otherRange && range[0] <= otherRange[1] && range[1] >= otherRange[0] &&
					otherProto.some(p => p == '*' || p == 'all' || p == 'any' || proto.includes(p)))
					return _('Incoming ports overlap with “%s”.').format(other.name || other['.name']);
			}
			return true;
		};

		let o = s.option(form.Value, 'name', _('Name'));
		o.modalonly = true;

		o = s.option(form.DummyValue, '_outbound', _('Outbound trigger'));
		o.modalonly = false;
		o.textvalue = section => '%s → %s: %s %s'.format(
			uci.get('firewall', section, 'src') || 'lan',
			uci.get('firewall', section, 'dest') || 'wan',
			protocols(uci.get('firewall', section, 'trigger_proto') || 'tcp').join('/').toUpperCase(),
			uci.get('firewall', section, 'trigger_port') || '');

		o = s.option(form.DummyValue, '_inbound', _('Incoming ports'));
		o.modalonly = false;
		o.textvalue = section => '%s %s'.format(
			protocols(uci.get('firewall', section, 'open_proto')).join('/').toUpperCase(),
			uci.get('firewall', section, 'open_port') || '');

		o = s.option(form.Flag, 'enabled', _('Enabled'));
		o.default = o.enabled;
		o.editable = true;
		o.validate = function(section) {
			// Checkbox validation receives its HTML value even when unchecked.
			return value(this, section, 'enabled') == '0' ? true : allocation(this, section, value(this, section, 'open_port'));
		};

		for (const [key, label, defaultZone] of [
			['src', _('Internal zone'), 'lan'],
			['dest', _('External zone'), 'wan']
		]) {
			o = s.option(widgets.ZoneSelect, key, label);
			o.modalonly = true;
			o.rmempty = false;
			o.nocreate = true;
			o.default = defaultZone;
			o.validate = function(section, zone) {
				return zone != '*' && zone != value(this, section, key == 'src' ? 'dest' : 'src')
					? true : _('Choose two distinct zones.');
			};
		}

		for (const [key, label, defaultProtocol] of [
			['trigger_proto', _('Outbound protocol'), 'tcp'],
			['open_proto', _('Incoming protocol'), 'tcpudp']
		]) {
			o = s.option(form.ListValue, key, label);
			o.modalonly = true;
			o.rmempty = false;
			o.default = defaultProtocol;
			o.value('tcp', _('TCP'));
			o.value('udp', _('UDP'));
			o.value('tcpudp', _('TCP and UDP'));
			o.cfgvalue = section => {
				const configured = uci.get('firewall', section, key);
				return configured ? (protocols(configured).length > 1 ? 'tcpudp' : protocols(configured)[0]) : defaultProtocol;
			};
		}

		for (const [key, label] of [
			['trigger_port', _('Outbound destination port')],
			['open_port', _('Incoming port')]
		]) {
			o = s.option(form.Value, key, label, key == 'open_port'
				? _('A port or range, forwarded without changing the port number. These ports are reserved from UPnP, NAT-PMP and PCP while this rule is enabled.')
				: _('A port or range. Traffic must be allowed by the normal forwarding policy.'));
			o.modalonly = true;
			o.rmempty = false;
			o.datatype = 'portrange';
			o.validate = function(section, input) {
				if (key == 'open_port' && value(this, section, 'enabled') != '0')
					return allocation(this, section, input);
				const range = ports(input);
				if (!range || range[0] < 1 || range[1] > 65535 || range[0] > range[1])
					return _('Enter a port or range from 1 to 65535.');
				return true;
			};
		}

		o = s.option(form.Value, 'timeout', _('Trigger timeout (seconds)'));
		o.modalonly = true;
		o.rmempty = false;
		o.default = '600';
		o.datatype = 'and(uinteger,range(1,86400))';

		return m.render();
	}
});
