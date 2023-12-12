package types

import (
	"golang.org/x/net/webdav"
	"io/fs"
)

type Action struct {
	Action string     `json:"action"`
	Data   ActionData `json:"data"`
}

type ActionData struct {
	TableName string    `json:"table_name,omitempty"`
	TableId   string    `json:"table_id,omitempty"`
	Records   []*Record `json:"records,omitempty"`
	WebDavId  string    `json:"webdav_id,omitempty"`
	Disk      string    `json:"disk,omitempty"`
}

type Resp struct {
	Code int    `json:"code"`
	Msg  string `json:"msg,omitempty"`
	Data any    `json:"data,omitempty"`
}

type myFile interface {
	Stat() (fs.FileInfo, error)
	File() (webdav.File, error)
}
