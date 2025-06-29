package mods

import (
	"fmt"
	"net/http"
	"os"

	"github.com/os-vector/wired/vars"
)

type JdocSettings struct {
	vars.Modification
}

func NewJdocSettings() *JdocSettings {
	return &JdocSettings{}
}

func (modu *JdocSettings) Name() string {
	return "JdocSettings"
}

func (modu *JdocSettings) Description() string {
	return "Modifies CPU/RAM frequency for faster operation."
}

func (modu *JdocSettings) Load() error {
	return nil
}

func (m *JdocSettings) HTTP(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/api/mods/AutoUpdate/isSelfMadeBuild" {
		if _, err := os.Stat("/etc/do-not-auto-update"); err == nil {
			fmt.Fprintf(w, "true")
		} else {
			fmt.Fprintf(w, "false")
		}
		return
	} else if r.URL.Path == "/api/mods/AutoUpdate/isInhibitedByUser" {
		if _, err := os.Stat("/data/data/user-do-not-auto-update"); err == nil {
			fmt.Fprintf(w, "true")
		} else {
			fmt.Fprintf(w, "false")
		}
		return
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
