package utils

import (
	"bytes"
	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/transform"
	"io/ioutil"
	"os/exec"
)

func Mount(url, disk string) error {
	output, err := exec.Command("net", "use", disk, url).CombinedOutput()
	if err != nil && len(output) == 0 {
		panic(err)
	}
	//utf8Output, _, _ := transform.Bytes(simplifiedchinese.GBK.NewDecoder(), output)
	//slog.Debug(string(utf8Output))
	return nil
}

func UnMount(disk string) error {
	output, err := exec.Command("net", "use", disk, "/delete").CombinedOutput()
	if err != nil && len(output) == 0 {
		panic(err)
	}
	//utf8Output, _, _ := transform.Bytes(simplifiedchinese.GBK.NewDecoder(), output)
	//slog.Debug(string(utf8Output))
	return nil
}

func GbkToUtf8(str []byte) (b []byte, err error) {
	r := transform.NewReader(bytes.NewReader(str), simplifiedchinese.GBK.NewDecoder())
	b, err = ioutil.ReadAll(r)
	if err != nil {
		return
	}
	return
}

// transform UTF-8 bytes to GBK bytes
func Utf8ToGbk(str []byte) (b []byte, err error) {
	r := transform.NewReader(bytes.NewReader(str), simplifiedchinese.GBK.NewEncoder())
	b, err = ioutil.ReadAll(r)
	if err != nil {
		return
	}
	return
} // transform GBK string to UTF-8 string and replace it, if transformed success, returned nil error, or died by error message
func StrToUtf8(str *string) error {
	b, err := GbkToUtf8([]byte(*str))
	if err != nil {
		return err
	}
	*str = string(b)
	return nil
}

// transform UTF-8 string to GBK string and replace it, if transformed success, returned nil error, or died by error message
func StrToGBK(str *string) error {
	b, err := Utf8ToGbk([]byte(*str))
	if err != nil {
		return err
	}
	*str = string(b)
	return nil
}
