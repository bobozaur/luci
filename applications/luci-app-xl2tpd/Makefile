# SPDX-License-Identifier: GPL-2.0-or-later
include $(TOPDIR)/rules.mk

PKG_VERSION:=1.0
PKG_RELEASE:=1
PKG_LICENSE:=GPL-2.0-or-later

LUCI_TITLE:=LuCI support for L2TP servers
LUCI_DEPENDS:=+luci-base +luci-proto-ppp +xl2tpd

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
