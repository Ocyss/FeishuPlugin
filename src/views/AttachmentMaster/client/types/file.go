package types

import (
	"context"
	"errors"
	"fmt"
	"golang.org/x/net/webdav"
	"io"
	"io/fs"
	"log/slog"
	"mime"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"sync/atomic"
	"time"
)

// https://github.com/hairyhenderson/go-fsimpl
type fileInfo struct {
	modTime     time.Time
	name        string
	contentType string
	size        int64
	mode        fs.FileMode
}

func (fi *fileInfo) ContentType() string        { return fi.contentType }
func (fi *fileInfo) IsDir() bool                { return fi.Mode().IsDir() }
func (fi *fileInfo) Mode() fs.FileMode          { return fi.mode }
func (fi *fileInfo) ModTime() time.Time         { return fi.modTime }
func (fi *fileInfo) Name() string               { return fi.name }
func (fi *fileInfo) Size() int64                { return fi.size }
func (fi *fileInfo) Sys() interface{}           { return nil }
func (fi *fileInfo) Info() (fs.FileInfo, error) { return fi, nil }
func (fi *fileInfo) Type() fs.FileMode          { return fi.Mode().Type() }

type httpFile struct {
	a        *Attachments
	father   *httpDir
	recordId string
	fieldId  string
	index    int64
	ctx      context.Context
	body     io.ReadCloser
	fi       *fileInfo
	u        *url.URL
	hdr      http.Header
	path     string
	offset   atomic.Int64
}

func (f *httpFile) Seek(offset int64, whence int) (int64, error) {
	if f.body == nil || f.fi == nil {
		body, err := f.request(http.MethodGet)
		if err != nil {
			return 0, err
		}
		f.body = body
	}
	oldOffset := f.offset.Load()
	var newOffset int64
	switch whence {
	case io.SeekStart:
		newOffset = offset
	case io.SeekCurrent:
		newOffset = oldOffset + offset
	case io.SeekEnd:
		return f.fi.Size(), nil
	default:
		return -1, os.ErrInvalid
	}

	if newOffset < 0 {
		// offset out of range
		return oldOffset, os.ErrInvalid
	}
	if newOffset == oldOffset {
		// offset not changed, so return directly
		return oldOffset, nil
	}
	f.offset.Store(newOffset)
	slog.Debug("httpFile Seek", "offset", offset, "newOffset", newOffset, "whence", whence)
	return newOffset, nil
}

func (f *httpFile) Readdir(count int) ([]fs.FileInfo, error) {
	return nil, errors.New("httpFile no Readdir")
}

func (f *httpFile) Write(p []byte) (n int, err error) {
	return 0, errors.New("httpFile Write not implemented")
}

func (f *httpFile) File() (webdav.File, error) {
	return f, nil
}

func (f *httpFile) request(method string) (io.ReadCloser, error) {
	client := f.a.client
	req, err := http.NewRequest(method, f.u.String(), nil)
	if err != nil {
		return nil, err
	}

	req.Header = f.hdr

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}

	//modTime := time.Time{}
	//if mod := resp.Header.Get("Last-Modified"); mod != "" {
	//	// best-effort - if it can't be parsed, just ignore it...
	//	modTime, _ = http.ParseTime(mod)
	//}
	disp := resp.Header.Get("Content-Disposition")
	_, params, err := mime.ParseMediaType(disp)
	if err != nil {
		return nil, err
	}
	size, _ := strconv.ParseInt(resp.Header.Get("Content-Length"), 10, 64)
	f.fi = &fileInfo{
		name:        params["filename"],
		size:        size,
		mode:        0o644,
		modTime:     time.Now(),
		contentType: resp.Header.Get("Content-Type"),
	}
	if resp.StatusCode == 0 || resp.StatusCode >= 400 {
		return nil, fmt.Errorf("http GET failed with status %d", resp.StatusCode)
	}
	if f.path == "" {
		f.path = f.father.path + "/" + f.fi.name
		f.a.path[f.path] = f
	}
	// The response body must be closed later
	return resp.Body, nil
}

func (f *httpFile) Close() error {
	if f.body == nil {
		return nil
	}

	return f.body.Close()
}

func (f *httpFile) Read(p []byte) (int, error) {
	if f.body == nil || f.fi == nil {
		body, err := f.request(http.MethodGet)
		if err != nil {
			return 0, err
		}
		f.body = body
	}
	i, err := f.body.Read(p)
	slog.Debug("httpFile Read", "len(p)", len(p), "i", i, "err", err)
	return i, err
}

func (f *httpFile) Stat() (fs.FileInfo, error) {
	if f.body == nil || f.fi == nil {
		body, err := f.request(http.MethodHead)
		if err != nil {
			return nil, err
		}
		defer body.Close()
	}
	return f.fi, nil
}
