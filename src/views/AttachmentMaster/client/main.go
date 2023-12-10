package main

import (
	"AttachmentMasterClient/types"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
)

const port = ":16666"

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}
var router = mux.NewRouter()

func main() {
	server := &http.Server{
		Addr:    "0.0.0.0" + port,
		Handler: router,
	}
	router.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println(err)
			return
		}
		defer conn.Close()
		for {
			data := &types.Action{}
			err := conn.ReadJSON(data)
			if err != nil {
				return
			}
			log.Println(data)
			messageHandlers[data.Action](conn, data.Data)
		}
	})
	router.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("pong"))
	})
	log.Println("Server started on ws://127.0.0.1" + ":16666")
	log.Fatal(server.ListenAndServe())
}

var messageHandlers = map[string]func(*websocket.Conn, types.ActionData){
	"ping": func(conn *websocket.Conn, _ types.ActionData) {
		_ = conn.WriteMessage(websocket.TextMessage, []byte("pong"))
	},
	"create": handleCreate,
	"status": handleStatus,
	"add":    handleAdd,
	"reduce": handleReduce,
	"delete": handleDelete,
}
