package mods

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/os-vector/wired/vars"
)

type AutoUpdate struct {
	vars.Modification
}

func NewAutoUpdate() *AutoUpdate {
	return &AutoUpdate{}
}

var AutoUpdate_Current AutoUpdate_AcceptJSON

type AutoUpdate_AcceptJSON struct {
	Freq int `json:"freq"`
}

func (modu *AutoUpdate) Name() string {
	return "AutoUpdate"
}

func (modu *AutoUpdate) Description() string {
	return "Modifies CPU/RAM frequency for faster operation."
}

func (modu *AutoUpdate) RestartRequired() bool {
	return false
}

func (modu *AutoUpdate) DefaultJSON() any {
	return AutoUpdate_AcceptJSON{
		// default is balanced
		Freq: 1,
	}
}

func (modu *AutoUpdate) ToFS(to string) {
	// nothing
}

func (modu *AutoUpdate) Save(where string, in string) error {
	return nil
}

func (modu *AutoUpdate) Load() error {
	return nil
}

func (modu *AutoUpdate) Accepts() string {
	str, ok := modu.DefaultJSON().(AutoUpdate_AcceptJSON)
	if !ok {
		log.Fatal("AutoUpdate Accepts(): not correct type")
	}
	marshedJson, err := json.Marshal(str)
	if err != nil {
		log.Fatal(err)
	}
	return string(marshedJson)
}

func (modu *AutoUpdate) Current() string {
	marshalled, _ := json.Marshal(AutoUpdate_Current)
	return string(marshalled)
}

func (modu *AutoUpdate) Do(where string, in string) error {
	return nil
}

func AutoUpdate_HTTP(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/api/mods/AutoUpdate/isSelfMadeBuild" {
		if _, err := os.Stat("/etc/do-not-auto-update"); err == nil {
			fmt.Fprintf(w, "true")
		} else {
			fmt.Fprintf(w, "false")
		}
		vars.HTTPSuccess(w, r)
	} else if r.URL.Path == "/api/mods/AutoUpdate/isInhibitedByUser" {
		if _, err := os.Stat("/data/data/user-do-not-auto-update"); err == nil {
			fmt.Fprintf(w, "true")
		} else {
			fmt.Fprintf(w, "false")
		}
		vars.HTTPSuccess(w, r)
	} else if r.URL.Path == "/api/mods/AutoUpdate/setInhibited" {
		os.WriteFile("/data/data/user-do-not-auto-update", []byte("true"), 0777)
		vars.HTTPSuccess(w, r)
	} else if r.URL.Path == "/api/mods/AutoUpdate/setAllowed" {
		os.Remove("/data/data/user-do-not-auto-update")
		vars.HTTPSuccess(w, r)
	} else {
		vars.HTTPError(w, r, "404 not found")
	}
}
