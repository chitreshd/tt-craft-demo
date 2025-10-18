package api

import (
	"refund-demo/internal/store"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"
)

func RegisterRoutes(app *fiber.App, db *sqlx.DB) {
	api := app.Group("/v1")
	
	api.Get("/status/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")
		status, err := store.GetReturnByID(db, id)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "not found"})
		}
		return c.JSON(status)
	})

	api.Post("/status/explain", ExplainHandler)
	
	app.Post("/internal/scrape", func(c *fiber.Ctx) error {
		returnID, err := store.InsertDemoReturn(db)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "failed to insert demo data"})
		}
		return c.JSON(fiber.Map{
			"message": "demo data inserted",
			"return_id": returnID,
		})
	})
}
