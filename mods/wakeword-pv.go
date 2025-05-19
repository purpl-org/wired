package mods

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/os-vector/wired/vars"
)

type WakeWordPVRequest struct {
	Keyword string `json:"keyword"`
}

type WakeWordPVResponseFailure struct {
	Code  ErrorCode `json:"code"`
	Error string    `json:"error"`
}

type WakeWordPVResponseSuccess struct {
	File string `json:"file"`
}

// error codes for optimizer failures
type ErrorCode int

const (
	CodeIO ErrorCode = iota + 1
	CodePronunciation
	CodeUnknown
)

var WakeWordPVLocation = "/data/data/com.anki.victor/persistent/picovoice/custom.ppn"

type WakeWordPV struct {
	vars.Modification
}

func NewWakeWordPV() *WakeWordPV {
	return &WakeWordPV{}
}

var WakeWordPV_Current WakeWordPV_AcceptJSON

type WakeWordPV_AcceptJSON struct {
	Default bool `json:"default"`
}

func (modu *WakeWordPV) Name() string {
	return "WakeWordPV"
}

func (modu *WakeWordPV) Description() string {
	return "Train a new wake word with Picovoice."
}

func (modu *WakeWordPV) RestartRequired() bool {
	return true
}

func (modu *WakeWordPV) DefaultJSON() any {
	return BootAnim_AcceptJSON{
		Default: true,
	}
}

func WakeWordPV_HTTP(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/api/mods/wakeword-pv/request-model" {
		kw := r.FormValue("keyword")
		if kw == "" {
			vars.HTTPError(w, r, "keyword not given")
			return
		}
		var reqKW WakeWordPVRequest
		reqKW.Keyword = kw
		jsonKW, _ := json.Marshal(reqKW)
		resp, err := http.Post("http://192.168.1.105:8080/create-model", "application/json", bytes.NewReader(jsonKW))
		if err != nil {
			vars.HTTPError(w, r, "network error")
			return
		}
		defer resp.Body.Close()

		b, _ := io.ReadAll(resp.Body)
		if resp.StatusCode != 200 {
			var kwFail WakeWordPVResponseFailure
			json.Unmarshal(b, &kwFail)
			if kwFail.Code == CodePronunciation {
				vars.HTTPError(w, r, "pronounciation not found in resource files, try using more common words.")
			} else {
				vars.HTTPError(w, r, kwFail.Error)
			}
			return
		}
		var kwSuccess WakeWordPVResponseSuccess
		json.Unmarshal(b, &kwSuccess)
		decoded, err := base64.StdEncoding.DecodeString(kwSuccess.File)
		if err != nil {
			vars.HTTPError(w, r, "Error decoding keyword file: "+err.Error())
			return
		}
		os.MkdirAll(filepath.Dir(WakeWordPVLocation), 0777)
		err = os.WriteFile(WakeWordPVLocation, decoded, 0777)
		if err != nil {
			vars.HTTPError(w, r, "Error writing model file to disk: "+err.Error())
			return
		}
		vars.HTTPSuccess(w, r)
	} else if r.URL.Path == "/api/mods/wakeword-pv/delete-model" {
		os.Remove(WakeWordPVLocation)
		vars.HTTPSuccess(w, r)
	}
}

func (modu *WakeWordPV) Save(where string, in string) error {
	return nil
}

func (modu *WakeWordPV) Load() error {
	return nil
}

func (modu *WakeWordPV) Accepts() string {
	str, ok := modu.DefaultJSON().(WakeWordPV_AcceptJSON)
	if !ok {
		log.Fatal("WakeWord Accepts(): not correct type")
	}
	marshedJson, err := json.Marshal(str)
	if err != nil {
		log.Fatal(err)
	}
	return string(marshedJson)
}

func (modu *WakeWordPV) Current() string {
	marshalled, _ := json.Marshal(WakeWordPV_Current)
	return string(marshalled)
}

func (modu *WakeWordPV) Do(where string, in string) error {
	return nil
}
