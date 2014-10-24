TOP_DIR = ../..
DEPLOY_RUNTIME ?= /kb/runtime
TARGET ?= /kb/deployment
include $(TOP_DIR)/tools/Makefile.common

SERVICE_NAME = Oxcart
SERVICE_DIR  = oxcart

WS_URL = https://kbase.us/services/ws
FBA_URL = https://kbase.us/services/KBaseFBAModeling

TPAGE_ARGS = --define ws_url=$(WS_URL) --define fba_url=$(FBA_URL)

default:

deploy: deploy-client

deploy-client: deploy-configs
	rsync --exclude '.git' -arv . $(TARGET)/services/$(SERVICE_DIR)/webroot/.

deploy-configs: build-configs
	-mkdir -p $(TARGET)/services/$(SERVICE_DIR)/webroot
	rsync -arv config.js $(TARGET)/services/$(SERVICE_DIR)/webroot/

build-configs:
	$(TPAGE) $(TPAGE_ARGS) templates/config.js.tt > config.js



include $(TOP_DIR)/tools/Makefile.common.rules
