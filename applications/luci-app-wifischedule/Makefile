# Copyright (c) 2016, prpl Foundation
#
# Permission to use, copy, modify, and/or distribute this software for any purpose with or without
# fee is hereby granted, provided that the above copyright notice and this permission notice appear
# in all copies.
#
# THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE
# INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE
# FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
# LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
# ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
#
# Author: Nils Koenig <openwrt@newk.it>

include $(TOPDIR)/rules.mk

PKG_VERSION=$(PKG_SRC_VERSION)

LUCI_TITLE:=Turns WiFi on and off according to a schedule
LUCI_DEPENDS:=+luci-base +wifischedule
PKG_RELEASE:=5

PKG_LICENSE:=ISC
PKG_MAINTAINER:=Nils Koenig <openwrt@newk.it>

# Rebuild the native config trigger on live upgrades as well as image boot.
define Package/luci-app-wifischedule/postinst
[ -n "$${IPKG_INSTROOT}" ] || {
	rm -f /tmp/luci-indexcache.*
	rm -rf /tmp/luci-modulecache/
	/etc/init.d/rpcd reload 2>/dev/null
	/etc/init.d/ucitrack reload
}
endef

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
