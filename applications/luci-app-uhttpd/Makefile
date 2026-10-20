#
# Copyright (C) 2015 OpenWrt.org
#
# This is free software, licensed under the Apache License, Version 2.0 .

include $(TOPDIR)/rules.mk

PKG_VERSION=$(PKG_SRC_VERSION)
PKG_RELEASE:=2

LUCI_TITLE:=uHTTPd Webserver Configuration
LUCI_DEPENDS:=+luci-base +uhttpd

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=Daniel F. Dickinson <dfdpublic@wildtechgarden.ca>

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
