#
# Copyright (C) 2026 OpenWRT
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

PKG_VERSION=$(PKG_SRC_VERSION)
PKG_RELEASE:=1

LUCI_TITLE:=Support for OpenVPN
LUCI_DEPENDS:=+openvpn
LUCI_PKGARCH:=all

PKG_LICENSE:=Apache-2.0

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
