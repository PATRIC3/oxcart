TOP_DIR = ../..
DEPLOY_RUNTIME ?= /kb/runtime
TARGET ?= /kb/deployment
include $(TOP_DIR)/tools/Makefile.common

SERVICE_NAME = Oxcart
SERVICE_DIR  = oxcart

# These should all be handled by the auto-deploy
WS_URL = https://kbase.us/services/ws
FBA_URL = https://kbase.us/services/KBaseFBAModeling
APP_NAME = "App Name"
APP_URL = http://140.221.66.219:7124
AUTH_URL = http://tutorial.theseed.org/Sessions/Login
SHOCK_URL = http://tutorial.theseed.org/services/shock_api

TPAGE_ARGS = --define ws_url=$(WS_URL) \
	--define fba_url=$(FBA_URL) \
	--define app_name=$(APP_NAME) \
	--define app_url=$(APP_URL) \
	--define auth_url=$(AUTH_URL) \
	--define shock_url=$(SHOCK_URL)

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
