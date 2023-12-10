package types

import (
	"errors"
	"io"
	"io/fs"
)

type HttpFile struct {
	body io.ReadCloser
}

func (f *HttpFile) Readdir(count int) ([]fs.FileInfo, error) {
	return nil, nil
}

func (f *HttpFile) Stat() (fs.FileInfo, error) {
	return nil, nil
}

func (f *HttpFile) Write(p []byte) (n int, err error) {
	return 0, errors.New("write not supported")
}

func (f *HttpFile) Close() error {
	return f.body.Close()
}

func (f *HttpFile) Read(p []byte) (n int, err error) {
	return f.body.Read(p)
}

func (f *HttpFile) Seek(offset int64, whence int) (int64, error) {
	return 0, errors.New("seek not supported")
}
