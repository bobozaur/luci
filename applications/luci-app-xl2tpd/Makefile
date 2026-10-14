# SPDX-License-Identifier: GPL-2.0-or-later
include $(TOPDIR)/rules.mk

PKG_VERSION:=1.0
PKG_RELEASE:=1
PKG_LICENSE:=GPL-2.0-or-later

LUCI_TITLE:=LuCI support for L2TP servers
LUCI_DEPENDS:=+luci-base +luci-proto-ppp +xl2tpd

define Package/luci-app-xl2tpd/postinst
[ -n "$${IPKG_INSTROOT}" ] || {
	rm -f /tmp/luci-indexcache.*
	rm -rf /tmp/luci-modulecache/
	/etc/init.d/rpcd reload 2>/dev/null
	/etc/init.d/ucitrack reload
}
endef

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
