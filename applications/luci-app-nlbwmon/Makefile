include $(TOPDIR)/rules.mk

PKG_VERSION=$(PKG_SRC_VERSION)
PKG_RELEASE:=4

PKG_LICENSE:=Apache-2.0

LUCI_TITLE:=Netlink based bandwidth accounting
LUCI_DEPENDS:=+luci-base +luci-lib-chartjs +nlbwmon
LUCI_EXTRA_DEPENDS:=nlbwmon (>=2025.06.02~29236be6-r4)

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=Jo-Philipp Wich <jo@mein.io>

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
