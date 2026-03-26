package util

import (
	"context"
	"dn-backend-go/internal/config"
	"fmt"
	"strings"
)

// Task defines a background work unit
type Task struct {
	Type    string
	Payload map[string]interface{}
}

// Global task queue and worker
var TaskQueue = make(chan Task, 1000)

// StartWorker initialized the worker pool to process background tasks
func StartWorker() {
	go func() {
		fmt.Println("[Worker]   Background worker started (Ready for tasks)")
		for task := range TaskQueue {
			processTask(task)
		}
	}()
}

func processTask(t Task) {
	fmt.Printf("[Worker]   Processing task: %s\n", t.Type)

	switch t.Type {
	case "wc_webhook":
		topic, _ := t.Payload["topic"].(string)
		id := fmt.Sprintf("%v", t.Payload["id"])

		if strings.Contains(topic, "product") {
			FlushCacheByPattern("products:*")
			FlushCacheByPattern("product:" + id)
			FlushCacheByPattern("variations:" + id)
		} else if strings.Contains(topic, "category") {
			FlushCacheByPattern("categories:*")
		}

	case "cache_flush_all":
		if config.RedisClient != nil {
			config.RedisClient.FlushAll(context.Background())
			fmt.Println("[Worker]  Manual cache flush completed")
		}

	case "log_event":
		// Analytics or audit log processing could happen here
		fmt.Printf("[Worker] Event: %v\n", t.Payload["message"])
	}
}
