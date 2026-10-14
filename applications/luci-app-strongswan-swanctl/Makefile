# Copyright 2021 Nicholas Smith (nicholas@nbembedded.com)
# Copyright (C) 2023 TDT AG <development@tdt.de>
#
# This is free software, licensed under the GNU General Public License v2.

include $(TOPDIR)/rules.mk

PKG_VERSION=$(PKG_SRC_VERSION)
PKG_RELEASE:=1

PKG_LICENSE:=GPL-2.0-or-later
PKG_MAINTAINER:=Nicholas Smith <nicholas@nbembedded.com>, Lukas Voegl <lvoegl@tdt.de>

LUCI_TITLE:=LuCI support for strongSwan via swanctl
LUCI_DESCRIPTION:=Status and configuration for strongSwan based on swanctl
LUCI_DEPENDS:=+luci-base +strongswan-swanctl +swanmon

define Package/luci-app-strongswan-swanctl/postinst
[ -n "$${IPKG_INSTROOT}" ] || {
	rm -f /tmp/luci-indexcache.*
	rm -rf /tmp/luci-modulecache/
	/etc/init.d/rpcd reload 2>/dev/null
	/etc/init.d/ucitrack reload
}
endef

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
