package types

import (
	"errors"
	"fmt"
	"io"
	"io/fs"
	"mime"
	"net/http"
	"os"
	"strconv"
	"sync/atomic"
	"time"
)

type File struct {
	Attachments *Attachments
	files       map[string]*File
	father      *File
	name        string
	size        int64
	modTime     time.Time
	isDir       bool
	show        bool   // 是否显示
	ask         bool   // 是否需求请求
	url         string // 下载地址
	id          string // 记录id
	data        io.ReadCloser
	offset      atomic.Int64
}

func (f *File) Close() error {
	if f.data != nil {
		f.data.Close()
	}
	return nil
}

func (f *File) Read(b []byte) (int, error) {
	if f.data != nil {
		return f.data.Read(b)
	}
	return 0, nil
}

func (f *File) Seek(offset int64, whence int) (int64, error) {
	fmt.Println("Seek", offset, whence)
	if f.data == nil {
		res, err := http.Get(f.url)
		if err != nil {
			return 0, err
		}
		if res.StatusCode >= 400 {
			return 0, errors.New("wrong status code")
		}
		f.data = res.Body
	}
	oldOffset := f.offset.Load()
	var newOffset int64
	switch whence {
	case io.SeekStart:
		newOffset = offset
	case io.SeekCurrent:
		newOffset = oldOffset + offset
	case io.SeekEnd:
		return f.size, nil
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
	return newOffset, nil
}

func (f *File) Readdir(count int) ([]fs.FileInfo, error) {
	n := len(f.files)
	if count > 0 {
		n = count
	}
	files := make([]fs.FileInfo, 0, n)
	for _, v := range f.files {
		_, err := v.Stat()
		if err != nil {
			fmt.Println("Readdir err", err, v)
			continue
		}
		files = append(files, v)
		if len(files) >= n {
			break
		}
	}
	fmt.Println("Readdir", count, f.name, files)
	return files, nil
}

func (f *File) Stat() (fs.FileInfo, error) {
	if f == nil {
		fmt.Println("Stat file is nil")
		return nil, errors.New("file is nil")
	}
	if !f.isDir && !f.ask && f.url != "" {
		resp, err := http.Head(f.url)
		fmt.Println("resp", err)
		if err != nil {
			return nil, err
		}
		disp := resp.Header.Get("Content-Disposition")
		fmt.Println("disp", disp)
		_, params, err := mime.ParseMediaType(disp)
		if err != nil {
			return nil, err
		}
		fmt.Println("params", params)
		f.name = params["filename"]
		f.size, _ = strconv.ParseInt(resp.Header.Get("Content-Length"), 10, 64)
		f.modTime = time.Now()
		f.ask = true
		delete(f.father.files, f.url)
		f.father.files[f.name] = f
	}
	return f, nil
}

func (f *File) Write(p []byte) (n int, err error) {
	return 0, errors.New("write not supported")
}

func (f *File) Name() string {
	if f == nil {
		return "noName.ocyss"
	}
	return f.name
}

func (f *File) Size() int64 {
	if f == nil {
		return 0
	}
	return f.size
}

func (f *File) Mode() fs.FileMode {
	return os.ModePerm
}

func (f *File) ModTime() time.Time {
	if f == nil {
		return time.Now()
	}
	return f.modTime
}

func (f *File) IsDir() bool {
	if f == nil {
		return false
	}
	return f.isDir
}

func (f *File) Sys() any {
	return nil
}
