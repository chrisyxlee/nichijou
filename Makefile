.PHONY: run
run:
	hugo server -t terminal

.PHONY: one-time-setup
one-time-setup:
	brew install npm
	brew install yarn
	brew install hugo

