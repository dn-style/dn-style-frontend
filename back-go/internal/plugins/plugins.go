package plugins

import (
	"dn-backend-go/pkg/orderhook"
	"fmt"
	"path/filepath"
	"plugin"
)

// OrderInterceptors is the global registry of loaded plugins
var OrderInterceptors []orderhook.OrderInterceptor

// RegisterOrderInterceptor adds a plugin to the registry
func RegisterOrderInterceptor(p orderhook.OrderInterceptor) {
	OrderInterceptors = append(OrderInterceptors, p)
	fmt.Printf("[Plugins]  Interceptor registrado: %T\n", p)
}

// LoadDynamicPlugins scans ./plugins/ for .so files and loads them
func LoadDynamicPlugins() {
	files, err := filepath.Glob("./plugins/*.so")
	if err != nil {
		fmt.Printf("[Plugins]  Error scanning folder: %v\n", err)
		return
	}

	for _, f := range files {
		fmt.Printf("[Plugins]  Loading dynamic plugin: %s\n", f)
		p, err := plugin.Open(f)
		if err != nil {
			fmt.Printf("[Plugins]  Error opening %s: %v\n", f, err)
			continue
		}

		symbol, err := p.Lookup("Plugin")
		if err != nil {
			fmt.Printf("[Plugins]  Plugin %s does not export 'Plugin'\n", f)
			continue
		}

		interceptor, ok := symbol.(orderhook.OrderInterceptor)
		if !ok {
			fmt.Printf("[Plugins]  'Plugin' in %s does not implement OrderInterceptor\n", f)
			continue
		}

		RegisterOrderInterceptor(interceptor)
		fmt.Printf("[Plugins]  Plugin loaded: %s\n", f)
	}
}
