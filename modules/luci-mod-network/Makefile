#
# Copyright (C) 2008-2014 The LuCI Team <luci@lists.subsignal.org>
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

PKG_VERSION=$(PKG_SRC_VERSION)
PKG_RELEASE:=8

LUCI_TITLE:=LuCI Network Administration
LUCI_EXTRA_DEPENDS:=luci-base (>=26.296.84055~13f7ea2-r3), netifd (>=2026.09.11~06d06c86-r8), rpcd-mod-iwinfo (>=2026.10.04~d99f703e-r6)
LUCI_DEPENDS:=+netifd +luci-base +rpcd-mod-iwinfo +luci-lib-uqr

PKG_LICENSE:=Apache-2.0

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature

