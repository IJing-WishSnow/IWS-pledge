package config

import (
	"path"
	"path/filepath"
	"runtime"

	"github.com/BurntSushi/toml"
)

func init() {
	// 1. 获取配置文件路径
	currentAbPath := getCurrentAbPathByCaller()
	tomlFile, err := filepath.Abs(currentAbPath + "/configV21.toml")
	//tomlFile, err := filepath.Abs(currentAbPath + "/configV22.toml")
	if err != nil {
		panic("read toml file err: " + err.Error())
		return
	}

	// 2. 解析 TOML 文件到 Config 结构体
	if _, err := toml.DecodeFile(tomlFile, &Config); err != nil {
		panic("read toml file err: " + err.Error())
		return
	}
}

func getCurrentAbPathByCaller() string {
	var abPath string
	_, filename, _, ok := runtime.Caller(0)
	if ok {
		abPath = path.Dir(filename)
	}
	return abPath
}
