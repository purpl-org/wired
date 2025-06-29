#!/bin/bash

if [[ ! -d porcupine ]]; then
	mkdir porcupine
	cd porcupine
	wget https://github.com/os-vector/wired/releases/download/v0.0.1/pv_porcupine_1-5_vector_fixed.tar.gz
	tar -zxvf pv_porcupine_1-5_vector_fixed.tar.gz
	rm pv_porcupine_1-5_vector_fixed.tar.gz
fi

mkdir -p output

go build -o pv-model-server main.go

echo "pv-model-server built"
