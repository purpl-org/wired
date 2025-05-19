package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
)

func main() {
    payload := map[string]string{"keyword": "hey vector"}
    body, _ := json.Marshal(payload)
    resp, err := http.Post("http://localhost:8080/optimize", "application/json", bytes.NewReader(body))
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    b, _ := ioutil.ReadAll(resp.Body)
    if resp.StatusCode != 200 {
        fmt.Printf("server error: %s\n", string(b))
        return
    }
    var success struct{ File string ` + "`json:\"file\"`" + ` }
    if err := json.Unmarshal(b, &success); err != nil {
        panic(err)
    }
    fmt.Println("got file at", success.File)
}
