#
# Copyright (C) 2017 Dan Luedtke <mail@danrl.com>
#
# This is free software, licensed under the GNU General Public License v2.

include $(TOPDIR)/rules.mk

PKG_VERSION=$(PKG_SRC_VERSION)

LUCI_TITLE:=LuCI support for the MWAN3 MultiWAN Manager
LUCI_DEPENDS:=+luci-base +mwan3
PKG_RELEASE:=2
PKG_LICENSE:=GPL-2.0

PKG_MAINTAINER:=Florian Eckert <fe@dev.tdt.de>

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
