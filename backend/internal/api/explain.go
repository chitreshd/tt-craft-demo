package api

import (
	"bufio"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/valyala/fasthttp"
)

func ExplainHandler(c *fiber.Ctx) error {
	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")
	c.Set("Transfer-Encoding", "chunked")
	
	chunks := []string{
		"It looks like your refund is taking a little longer than usual...",
		"High-income filers and early submissions are often reviewed more carefully...",
		"You can expect your deposit around March 20, with 94% confidence.",
	}
	
	c.Context().SetBodyStreamWriter(fasthttp.StreamWriter(func(w *bufio.Writer) {
		for _, msg := range chunks {
			fmt.Fprintf(w, "data: %s\n\n", msg)
			w.Flush()
			time.Sleep(500 * time.Millisecond)
		}
		fmt.Fprint(w, "data: [DONE]\n\n")
		w.Flush()
	}))
	
	return nil
}
