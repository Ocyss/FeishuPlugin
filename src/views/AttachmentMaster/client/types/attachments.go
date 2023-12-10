package types

import (
	"context"
	"errors"
	"fmt"
	"golang.org/x/net/webdav"
	"os"
	"strings"
	"time"
)

func NewAttachments(tableName string, tableId string) *Attachments {
	res := &Attachments{
		tableName: tableName,
		tableId:   tableId,
		osFile: &File{
			name:    "/",
			size:    6_660_666_666_666,
			modTime: time.Now(),
			isDir:   true,
			files:   make(map[string]*File),
		},
		recordMap: make(map[string]*Record),
	}
	res.osFile.Attachments = res

	return res
}

type Attachments struct {
	tableName string
	tableId   string
	recordMap map[string]*Record
	osFile    *File
}

type Record struct {
	Id   string   `json:"id"`
	Name string   `json:"name"`
	Urls []string `json:"urls"`
	show bool
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
	return a.getFile(ctx, name, flag, perm)
}

func (a *Attachments) Stat(ctx context.Context, name string) (os.FileInfo, error) {
	return a.getFile(ctx, name, os.O_RDONLY, 0)
}

func (a *Attachments) getFile(ctx context.Context, name string, flag int, perm os.FileMode) (*File, error) {
	if len(name) > 0 && name[0] == '/' {
		name = name[1:]
	}
	if len(name) > 0 && name[len(name)-1] == '/' {
		name = name[:len(name)-1]
	}
	path := strings.Split(name, "/")
	fmt.Printf("getFile<%s> %v,%d\n", name, path, len(path))
	if name == "" {
		fmt.Println("getFile 111")
		return a.osFile, nil
	}
	file := a.osFile.files[path[0]]
	if file == nil {
		return nil, errors.New("file not found")
	}
	if len(path) == 1 {
		return file, nil
	}
	if file.files[path[1]] == nil {
		return nil, errors.New("file not found")
	}
	return file.files[path[1]], nil
}

func (a *Attachments) Add(records []*Record) error {
	for _, record := range records {
		if v, ok := a.recordMap[record.Id]; ok {
			v.Urls = record.Urls
			v.Id = record.Id
			v.show = true
			continue
		}
		record.show = true
		a.recordMap[record.Id] = record
		files := make(map[string]*File, len(record.Urls))
		name := record.Id
		if record.Name != "" {
			//utils.StrToGBK(&record.Name)
			name = record.Name
		}
		file := &File{
			id:          record.Id,
			Attachments: a,
			name:        name,
			size:        0,
			modTime:     time.Now(),
			isDir:       true,
			show:        true,
			files:       files,
			father:      a.osFile,
		}

		for _, url := range record.Urls {
			files[url] = &File{
				id:          record.Id,
				Attachments: a,
				isDir:       false,
				show:        true,
				url:         url,
				files:       nil,
				father:      file,
			}
		}
		a.osFile.files[name] = file
	}
	return nil
}

func (a *Attachments) Reduce(records []string) error {
	for _, recordId := range records {
		if v, ok := a.recordMap[recordId]; ok {
			v.show = false
		}
	}
	return nil
}
