package main

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	dsn := "postgres://tagira:tagira_dev@localhost:5432/tagira?sslmode=disable"
	db, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		fmt.Println("Error connecting to db:", err)
		return
	}
	defer db.Close()

	hash := "$2a$10$lOIAjW4x2P7UbF3.HlJQa.SMuyXvvcxSJma3rfiZeQDBhzNu3s4Ja"
	query := "UPDATE users SET password_hash = $1 WHERE email = 'owner@tagira.dev'"
	_, err = db.Exec(context.Background(), query, hash)
	if err != nil {
		fmt.Println("Error updating db:", err)
		return
	}
	fmt.Println("Database updated successfully.")
}
