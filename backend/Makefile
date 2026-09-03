.PHONY: run migrate-up migrate-down test test-integration build lint tidy dev docker-build docker-up docker-down docker-logs deploy

# Run the server
run:
	go run cmd/api/main.go

# Run migrations up
migrate-up:
	go run cmd/api/main.go -migrate

# Run migrations down (1 step)
migrate-down:
	go run cmd/api/main.go -migrate-down=1

# Run unit tests
test:
	go test -v -race -count=1 ./...

# Run integration tests (requires running postgres)
test-integration:
	go test -v -race -count=1 -tags=integration ./...

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

# Docker commands
docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

# Deploy to production (requires root)
deploy:
	sudo ./deploy/deploy.sh production

# Generate OpenAPI spec (if using swag)
openapi:
	@echo "OpenAPI spec available at docs/openapi.yaml"

# Validate config
validate:
	go run cmd/api/main.go -validate

# Clean build artifacts
clean:
	rm -rf bin/ tmp/ coverage.out