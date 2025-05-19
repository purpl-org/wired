package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"encoding/base64"
)

type request struct {
	Keyword string `json:"keyword"`
}

type errorResponse struct {
	Code  ErrorCode `json:"code"`
	Error string    `json:"error"`
}

type successResponse struct {
	File string `json:"file"`
}

// error codes for optimizer failures
type ErrorCode int

const (
	CodeIO ErrorCode = iota + 1
	CodePronunciation
	CodeUnknown
)

func optimizeHandler(w http.ResponseWriter, r *http.Request) {
	var req request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"code":3,"error":"invalid json"}`, http.StatusBadRequest)
		return
	}
	kw := req.Keyword
	outDir, _ := os.Getwd()
	outDir = filepath.Join(outDir, "output")
	os.MkdirAll(outDir, 0755)
	outFile := filepath.Join(outDir, fmt.Sprintf("%s_linux.ppn", kw))
	if _, err := os.Stat(outFile); err == nil {
		outFileData, err := os.ReadFile(outFile)
		if err != nil {
			http.Error(w, `{"code":3,"error":"out file does not exist"}`, http.StatusInternalServerError)
			return
		}
		outFileB64 := base64.StdEncoding.EncodeToString(outFileData)
		json.NewEncoder(w).Encode(successResponse{File: outFileB64})
		return
	}
	cmd := exec.Command(
		"./porcupine/tools/optimizer/linux/x86_64/pv_porcupine_optimizer",
		"-r", filepath.Join(os.Getenv("PWD"), "porcupine/resources"),
		"-p", "linux",
		"-o", outDir+"/",
		"-w", kw,
	)
	out, err := cmd.CombinedOutput()
	stderr := string(out)
	var code ErrorCode
	if strings.Contains(stderr, "IO_ERROR") {
		code = CodeIO
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(errorResponse{Code: code, Error: stderr})
		return
	} else if strings.Contains(stderr, "could not find the") {
		code = CodePronunciation
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(errorResponse{Code: code, Error: stderr})
		return
	} else if err != nil {
		code = CodeUnknown
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(errorResponse{Code: code, Error: stderr})
		return
	}
	outFileData, err := os.ReadFile(outFile)
	if err != nil {
		http.Error(w, `{"code":3,"error":"out file does not exist"}`, http.StatusInternalServerError)
		return
	}
	outFileB64 := base64.StdEncoding.EncodeToString(outFileData)
	json.NewEncoder(w).Encode(successResponse{File: outFileB64})
}

func main() {
	http.HandleFunc("/wakeword-pv/create-model", optimizeHandler)
	fmt.Println("listening on :8080")
	http.ListenAndServe(":8080", nil)
}
