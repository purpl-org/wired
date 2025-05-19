#!/bin/bash

if [[ ! -d porcupine ]]; then
	wget https://github.com/os-vector/wired/releases/download/v0.0.1/porcupine-1.3-linux-rpi-patched.tar.gz
	tar -zxvf porcupine-1.3-linux-rpi-patched.tar.gz
	rm porcupine-1.3-linux-rpi-patched.tar.gz
fi

mkdir -p output

go build -o pv-model-server main.go

echo "pv-model-server built"
