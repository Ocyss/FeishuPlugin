package types

import (
	"errors"
	"golang.org/x/net/webdav"
	"io/fs"
	"log/slog"
	"sync"
	"time"
)

type httpDir struct {
	a        *Attachments
	father   *httpDir
	path     string
	name     string
	childs   []fs.FileInfo
	childMap map[string]myFile
	time     time.Time
	mu       sync.Mutex
}

func (h httpDir) Close() error {
	return nil
}

func (h httpDir) Read(p []byte) (n int, err error) {
	return 0, errors.New("httpDir Read not support")
}

func (h httpDir) Seek(offset int64, whence int) (int64, error) {
	return 0, errors.New("httpDir Seek not support")
}

func (h *httpDir) Readdir(count int) ([]fs.FileInfo, error) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if len(h.childs) == 0 {
		h.childs = make([]fs.FileInfo, 0, len(h.childMap))
		for _, v := range h.childMap {
			fi, _ := v.Stat()
			h.childs = append(h.childs, fi)
		}
	}
	if count <= 0 || count > len(h.childs) {
		count = len(h.childs)
	}
	res := h.childs[:count]
	h.childs = h.childs[count:]
	slog.Debug("httpDir Readdir", "count", count, "res", res)
	return res, nil
}

func (h *httpDir) Stat() (fs.FileInfo, error) {
	return h, nil
}

func (h httpDir) Write(p []byte) (n int, err error) {
	return 0, errors.New("httpDir Write not support")
}

func (h *httpDir) File() (webdav.File, error) {
	return h, nil
}

func (h httpDir) Name() string {
	return h.name
}

func (h httpDir) Size() int64 {
	return 666_666_666_666
}

func (h httpDir) Mode() fs.FileMode {
	return 0o644
}

func (h httpDir) ModTime() time.Time {
	return h.time
}

func (h httpDir) IsDir() bool {
	return true
}

func (h httpDir) Sys() any {
	return nil
}
