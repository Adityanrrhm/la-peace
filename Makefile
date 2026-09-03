.PHONY: run migrate-up migrate-down test build lint tidy dev

# Run the server
run:
	go run cmd/api/main.go

# Run migrations up
migrate-up:
	@if [ -f .env ]; then \
		export $$(cat .env | xargs); \
		migrate -path migrations -database "$$DB_USER:$$DB_PASSWORD@$$DB_HOST:$$DB_PORT/$$DB_NAME?sslmode=$$DB_SSL_MODE" up; \
	else \
		echo "No .env file found"; \
	fi

# Run migrations down (1 step)
migrate-down:
	@if [ -f .env ]; then \
		export $$(cat .env | xargs); \
		migrate -path migrations -database "$$DB_USER:$$DB_PASSWORD@$$DB_HOST:$$DB_PORT/$$DB_NAME?sslmode=$$DB_SSL_MODE" down 1; \
	else \
		echo "No .env file found"; \
	fi

# Run tests
test:
	go test -v -race -count=1 ./...

# Build binary
build:
	CGO_ENABLED=0 go build -o bin/tagira-api cmd/api/main.go

# Run linter
lint:
	golangci-lint run ./...

# Tidy dependencies
tidy:
	go mod tidy

# Development with air (hot reload)
dev:
	air -c .air.toml