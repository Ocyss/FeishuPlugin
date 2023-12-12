package main

import (
	"AttachmentMasterClient/types"
	"AttachmentMasterClient/utils"
	"fmt"
	"github.com/gorilla/websocket"
	"golang.org/x/net/webdav"
	"net/http"
	"strconv"
	"time"
)

type webDav struct {
	Id         string             `json:"id"`
	Url        string             `json:"url"`
	Attachment *types.Attachments `json:"-"`
}

var webDavMap = map[string]webDav{}

func Resp(code int, msg string, data ...any) types.Resp {
	if len(data) == 0 {
		return types.Resp{
			Msg:  msg,
			Code: code,
		}
	}
	return types.Resp{
		Msg:  msg,
		Code: code,
		Data: data[0],
	}
}

func handleCreate(conn *websocket.Conn, data types.ActionData) {
	attachment := types.NewAttachments(data.TableName, data.TableId)
	prefix := fmt.Sprintf("/dav/%s", data.TableId)
	fs := &webdav.Handler{
		Prefix:     prefix,
		FileSystem: attachment,
		LockSystem: webdav.NewMemLS(),
	}
	webdav.NewMemFS()
	router.PathPrefix(prefix).HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		//if req.Method == "GET" && handleDirList(fs.FileSystem, url, w, req) {
		//	return
		//}
		fs.ServeHTTP(w, req)
	})
	webDavId := strconv.FormatInt(time.Now().UnixMilli(), 10)
	url := fmt.Sprintf("http://localhost%s%s", port, prefix)
	webDavMap[webDavId] = webDav{
		Id:         webDavId,
		Url:        url,
		Attachment: attachment,
	}
	_ = conn.WriteJSON(Resp(0, "", webDavMap[webDavId]))
	utils.UnMount(data.Disk)
	utils.Mount(url, data.Disk)
}

func handleAdd(conn *websocket.Conn, data types.ActionData) {
	v, ok := webDavMap[data.WebDavId]
	if !ok {
		_ = conn.WriteJSON(Resp(1, "Add: not WebDavId"))
		return
	}
	v.Attachment.Adds(data.Records)
	_ = conn.WriteJSON(Resp(0, ""))
}

func handleReduce(conn *websocket.Conn, data types.ActionData) {
	_ = conn.WriteJSON(Resp(0, ""))
}

func handleDelete(conn *websocket.Conn, data types.ActionData) {
	_ = conn.WriteJSON(Resp(0, ""))
}

func handleStatus(conn *websocket.Conn, data types.ActionData) {
	v, ok := webDavMap[data.WebDavId]
	code := 0
	if !ok {
		code = 1
	}
	_ = conn.WriteJSON(Resp(code, "", v))
}
