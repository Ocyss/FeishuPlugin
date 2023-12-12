package main

import (
	"AttachmentMasterClient/types"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/lmittmann/tint"
	"github.com/mattn/go-colorable"
	"log/slog"
	"net/http"
	"os"
	"time"
)

const port = ":16666"

var (
	router   = mux.NewRouter()
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	messageHandlers = map[string]func(*websocket.Conn, types.ActionData){
		"ping": func(conn *websocket.Conn, _ types.ActionData) {
			_ = conn.WriteMessage(websocket.TextMessage, []byte("pong"))
		},
		"create": handleCreate,
		"status": handleStatus,
		"add":    handleAdd,
		"reduce": handleReduce,
		"delete": handleDelete,
	}
)

func main() {
	slog.SetDefault(slog.New(
		tint.NewHandler(colorable.NewColorable(os.Stdout), &tint.Options{
			Level:      slog.LevelDebug,
			TimeFormat: time.Kitchen,
		}),
	))
	server := &http.Server{
		Addr:    "0.0.0.0" + port,
		Handler: router,
	}
	router.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			slog.Error("WsUpgrade", err)
			return
		}
		defer conn.Close()
		for {
			data := &types.Action{}
			err := conn.ReadJSON(data)
			if err != nil {
				return
			}
			slog.Debug("WsMessage", data)
			messageHandlers[data.Action](conn, data.Data)
		}
	})
	router.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("pong"))
	})
	slog.Info("Server started on ws://localhost" + ":16666")
	slog.Info("server", "err", server.ListenAndServe())
}
