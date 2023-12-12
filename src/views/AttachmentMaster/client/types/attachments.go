package types

import (
	"context"
	"errors"
	"golang.org/x/net/webdav"
	"io/fs"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"time"
)

func NewAttachments(tableName string, tableId string) *Attachments {
	res := &Attachments{
		tableName: tableName,
		tableId:   tableId,
		client:    http.DefaultClient,
	}
	res.base = &httpDir{
		name:     tableId,
		a:        res,
		childs:   make([]fs.FileInfo, 0),
		childMap: make(map[string]myFile),
	}
	res.path = map[string]myFile{"": res.base}
	return res
}

type Attachments struct {
	tableName string
	tableId   string
	client    *http.Client
	headers   http.Header
	base      *httpDir
	path      map[string]myFile
}

type Record struct {
	RecordId string   `json:"record_id"`
	FieldId  string   `json:"field_id"`
	Name     string   `json:"name"`
	Urls     []string `json:"urls"`
	Path     string   `json:"path"`
}

func (a *Attachments) Mkdir(ctx context.Context, name string, perm os.FileMode) error {
	return errors.New("mkdir not supported")
}

func (a *Attachments) RemoveAll(ctx context.Context, name string) error {
	return errors.New("removeAll not supported")
}

func (a *Attachments) Rename(ctx context.Context, oldName, newName string) error {
	return errors.New("rename not supported")
}

func (a *Attachments) OpenFile(ctx context.Context, name string, flag int, perm os.FileMode) (webdav.File, error) {
	if len(name) > 0 && name[0] == '/' {
		name = name[1:]
	}
	slog.Debug("OpenFile", "name", name, "flag", flag, "val", a.path[name] != nil)
	if a.path[name] != nil {
		return a.path[name].File()
	}
	return nil, errors.New("not found")
}

func (a *Attachments) Stat(ctx context.Context, name string) (os.FileInfo, error) {
	if len(name) > 0 && name[0] == '/' {
		name = name[1:]
	}
	slog.Debug("Stat", "name", name, "val", a.path[name] != nil)
	if a.path[name] != nil {
		return a.path[name].Stat()
	}
	return nil, errors.New("not found")
}

func (a *Attachments) Add(record *Record) {
	name := record.Name
	if record.Name == "" {
		//utils.StrToGBK(&record.Name)
		name = record.RecordId + record.FieldId
	}
	dir := &httpDir{
		path:     name,
		a:        a,
		father:   a.base,
		name:     name,
		childs:   make([]fs.FileInfo, 0),
		childMap: make(map[string]myFile),
		time:     time.Time{},
	}
	for i, surl := range record.Urls {
		u, err := url.Parse(surl)
		if err != nil {
			slog.Error("AttachmentsAdd", "url.Parse", err)
			continue
		}
		file := &httpFile{
			a:        a,
			father:   dir,
			recordId: record.RecordId,
			fieldId:  record.FieldId,
			index:    int64(i),
			u:        u,
		}
		dir.childMap[name] = file
	}
	a.base.childMap[name] = dir
	a.path[dir.path] = dir
}

func (a *Attachments) Adds(records []*Record) {
	for _, record := range records {
		a.Add(record)
	}
}

func (a *Attachments) Reduce(records []string) error {
	return nil
}
