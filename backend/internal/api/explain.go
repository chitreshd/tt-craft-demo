package api

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os"
	"time"

	"refund-demo/internal/store"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"
	"github.com/rs/zerolog/log"
	openai "github.com/sashabaranov/go-openai"
	"github.com/valyala/fasthttp"
)

type ExplainRequest struct {
	ReturnID string `json:"return_id"`
	Question string `json:"question"`
}

func ExplainHandler(db *sqlx.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Set("Content-Type", "text/event-stream")
		c.Set("Cache-Control", "no-cache")
		c.Set("Connection", "keep-alive")
		c.Set("Transfer-Encoding", "chunked")

		// Parse request body (optional)
		var req ExplainRequest
		if err := c.BodyParser(&req); err != nil {
			// If no body, use defaults
			req.Question = "Why is my refund taking longer than expected?"
		}

		c.Context().SetBodyStreamWriter(fasthttp.StreamWriter(func(w *bufio.Writer) {
			// Step 1: Show thinking step - Analyzing return
			fmt.Fprintf(w, "data: 🔍 Analyzing your return...\n\n")
			w.Flush()
			time.Sleep(300 * time.Millisecond)

			// Fetch return data if ID provided
			var refundData *store.RefundReturn
			var err error
			if req.ReturnID != "" {
				refundData, err = store.GetReturnByID(db, req.ReturnID)
				if err != nil {
					log.Error().Err(err).Str("return_id", req.ReturnID).Msg("failed to fetch return")
				}
			}

			// Step 2: Show thinking step - Checking IRS data
			fmt.Fprintf(w, "data: 📊 Checking IRS processing times...\n\n")
			w.Flush()
			time.Sleep(300 * time.Millisecond)

			// Step 3: Show thinking step - Generating explanation
			fmt.Fprintf(w, "data: 🤖 Generating personalized explanation...\n\n")
			w.Flush()
			time.Sleep(300 * time.Millisecond)

			// Check if OpenAI is configured
			apiKey := os.Getenv("OPENAI_API_KEY")
			if apiKey == "" {
				// Fallback to demo mode if no API key
				log.Warn().Msg("OPENAI_API_KEY not set, using demo mode")
				streamDemoExplanation(w, refundData)
				return
			}

			// Stream from OpenAI
			streamOpenAIExplanation(w, apiKey, req.Question, refundData)
		}))

		return nil
	}
}

func streamDemoExplanation(w *bufio.Writer, refundData *store.RefundReturn) {
	// Demo mode with personalized data
	chunks := []string{
		"Based on your filing information, your refund is taking a little longer than usual.",
		"This is common for returns with your profile characteristics.",
	}

	if refundData != nil {
		chunks = append(chunks, fmt.Sprintf(
			"Your return (status: %s) has a confidence score of %.0f%% for the estimated date.",
			refundData.Status, refundData.Confidence*100,
		))
	} else {
		chunks = append(chunks, "High-income filers and early submissions are often reviewed more carefully.")
	}

	for _, msg := range chunks {
		fmt.Fprintf(w, "data: %s\n\n", msg)
		w.Flush()
		time.Sleep(400 * time.Millisecond)
	}

	fmt.Fprint(w, "data: [DONE]\n\n")
	w.Flush()
}

func streamOpenAIExplanation(w *bufio.Writer, apiKey, question string, refundData *store.RefundReturn) {
	client := openai.NewClient(apiKey)
	ctx := context.Background()

	// Build context from refund data
	systemPrompt := `You are a helpful tax assistant explaining refund delays. 
Be concise, friendly, and provide actionable information. Keep responses under 100 words.`

	userPrompt := question
	if refundData != nil {
		contextData := fmt.Sprintf(
			"\n\nReturn Context:\n- Status: %s\n- Confidence: %.0f%%\n- History: %d status changes",
			refundData.Status,
			refundData.Confidence*100,
			len(refundData.HistoryJSON),
		)
		if refundData.EtaDate != nil {
			contextData += fmt.Sprintf("\n- Estimated Date: %s", refundData.EtaDate.Format("Jan 2, 2006"))
		}
		userPrompt += contextData
	}

	req := openai.ChatCompletionRequest{
		Model:     openai.GPT4oMini, // Using GPT-4o-mini for cost efficiency
		MaxTokens: 200,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: systemPrompt,
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: userPrompt,
			},
		},
		Stream: true,
	}

	stream, err := client.CreateChatCompletionStream(ctx, req)
	if err != nil {
		log.Error().Err(err).Msg("failed to create OpenAI stream")
		fmt.Fprintf(w, "data: Error connecting to AI service. Please try again.\n\n")
		fmt.Fprint(w, "data: [DONE]\n\n")
		w.Flush()
		return
	}
	defer stream.Close()

	// Stream OpenAI response
	for {
		response, err := stream.Recv()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Error().Err(err).Msg("error receiving from OpenAI stream")
			break
		}

		if len(response.Choices) > 0 {
			content := response.Choices[0].Delta.Content
			if content != "" {
				// Send each chunk via SSE
				fmt.Fprintf(w, "data: %s\n\n", content)
				w.Flush()
			}
		}
	}

	fmt.Fprint(w, "data: [DONE]\n\n")
	w.Flush()
}
