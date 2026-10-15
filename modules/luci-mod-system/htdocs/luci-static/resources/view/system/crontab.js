'use strict';
'require view';
'require fs';
'require ui';

var isReadonlyView = !L.hasViewPermission() || null;

return view.extend({
	load: function() {
		return fs.read('/etc/crontabs/root').catch(function(e) {
			if (e.name === 'NotFoundError')
				return '';
			if (e.name === 'NoDataError')
				return fs.stat('/etc/crontabs/root').then(function(stat) {
					if (stat.type === 'file' && stat.size === 0)
						return '';
					throw e;
				});
			throw e;
		});
	},

	handleSave: function(ev) {
		if (!L.hasViewPermission())
			return Promise.reject(new Error(_('Permission denied.')));

		var value = (document.querySelector('textarea').value || '').trim().replace(/\r\n/g, '\n') + '\n';
		var saved = false;

		return fs.write('/etc/crontabs/root', value).then(function(rc) {
			saved = true;
			document.querySelector('textarea').value = value;
			return fs.exec('/etc/init.d/cron', [ 'reload' ]);
		}).then(function(result) {
			if (result.code !== 0)
				throw new Error(result.stderr || result.stdout || _('Cron reload failed.'));
			ui.addNotification(null, E('p', _('Contents have been saved and cron reload requested.')), 'info');
		}).catch(function(e) {
			var message = saved ? _('Contents were saved, but cron could not reload: %s') : _('Unable to save contents: %s');
			ui.addNotification(null, E('p', message.format(e.message)), 'error');
		});
	},

	render: function(crontab) {
		return E([
			E('h2', _('Scheduled Tasks')),
			E('p', { 'class': 'cbi-section-descr' }, _('This is the system crontab in which scheduled tasks can be defined.')),
			E('p', {}, E('textarea', { 'style': 'width:100%', 'rows': 25, 'disabled': isReadonlyView }, [ crontab != null ? crontab : '' ]))
		]);
	},

	handleSaveApply: null,
	handleReset: null
});
