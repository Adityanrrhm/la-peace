package main

import (
	"fmt"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	hash := "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGTe.8tBjz.d/M1VfK5F3uQ3Wgi"
	password := "tagira123"

	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		fmt.Println("Error:", err)
		newHash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		fmt.Println("Correct hash for tagira123:", string(newHash))
	} else {
		fmt.Println("Match!")
	}
}
