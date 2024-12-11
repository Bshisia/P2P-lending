package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"text/template"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	"golang.org/x/crypto/bcrypt"

	_ "github.com/mattn/go-sqlite3"
)

// Application configuration and state
type Application struct {
	db             *sql.DB
	sessionStore   *sessions.CookieStore
	templateCache  map[string]*template.Template
}

// User model
type User struct {
	ID       int
	Username string
	Email    string
	Password string
	Balance  float64
	Type     string // "borrower" or "lender"
}

// Loan model
type Loan struct {
	ID           int
	BorrowerID   int
	Amount       float64
	InterestRate float64
	Status       string
	CreatedAt    time.Time
	LenderID     sql.NullInt64
}

// Initialize application
func NewApplication() *Application {
	// Database connection
	db, err := sql.Open("sqlite3", "./p2p_lending.db")
	if err != nil {
		log.Fatal(err)
	}

	// Create tables if not exists
	createTables(db)

	// Session store
	sessionStore := sessions.NewCookieStore([]byte(os.Getenv("SESSION_KEY")))

	// Template cache
	templateCache := loadTemplates()

	return &Application{
		db:             db,
		sessionStore:   sessionStore,
		templateCache:  templateCache,
	}
}

// Create necessary database tables
func createTables(db *sql.DB) {
	// Users table
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			email TEXT UNIQUE NOT NULL,
			password TEXT NOT NULL,
			balance REAL DEFAULT 0,
			type TEXT NOT NULL
		)
	`)
	if err != nil {
		log.Fatal(err)
	}

	// Loans table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS loans (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			borrower_id INTEGER NOT NULL,
			amount REAL NOT NULL,
			interest_rate REAL NOT NULL,
			status TEXT NOT NULL,
			created_at DATETIME NOT NULL,
			lender_id INTEGER,
			FOREIGN KEY(borrower_id) REFERENCES users(id),
			FOREIGN KEY(lender_id) REFERENCES users(id)
		)
	`)
	if err != nil {
		log.Fatal(err)
	}
}

// Load HTML templates
func loadTemplates() map[string]*template.Template {
	templatesDir := "./templates"
	templates := make(map[string]*template.Template)

	// Define templates to load
	templateFiles := []string{
		"home", "login", "register", "dashboard", "create-loan",
	}

	for _, tmpl := range templateFiles {
		t, err := template.ParseFiles(
			fmt.Sprintf("%s/%s.html", templatesDir, tmpl),
			fmt.Sprintf("%s/base.html", templatesDir),
		)
		if err != nil {
			log.Fatalf("Error parsing template %s: %v", tmpl, err)
		}
		templates[tmpl] = t
	}

	return templates
}

// Home page handler
func (app *Application) homeHandler(w http.ResponseWriter, r *http.Request) {
	// Check for user session
	session, _ := app.sessionStore.Get(r, "session")
	userID, ok := session.Values["user_id"].(int)
	
	var user *User
	if ok {
		user = &User{}
		err := app.db.QueryRow(`
			SELECT id, username, email, balance, type 
			FROM users 
			WHERE id = ?
		`, userID).Scan(&user.ID, &user.Username, &user.Email, &user.Balance, &user.Type)
		if err != nil {
			user = nil
		}
	}

	data := struct {
		User *User
	}{
		User: user,
	}

	app.renderTemplate(w, "home", data)
}

// Authentication Handlers
func (app *Application) registerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" {
		app.renderTemplate(w, "register", nil)
		return
	}

	if r.Method == "POST" {
		// Parse form data
		err := r.ParseForm()
		if err != nil {
			http.Error(w, "Error parsing form", http.StatusBadRequest)
			return
		}

		username := r.Form.Get("username")
		email := r.Form.Get("email")
		password := r.Form.Get("password")
		userType := r.Form.Get("type")

		// Hash password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "Error hashing password", http.StatusInternalServerError)
			return
		}

		// Insert user into database
		_, err = app.db.Exec(`
			INSERT INTO users (username, email, password, type, balance) 
			VALUES (?, ?, ?, ?, ?)
		`, username, email, hashedPassword, userType, 1000.0) // Initial balance
		if err != nil {
			http.Error(w, "Error registering user: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Redirect to login
		http.Redirect(w, r, "/login", http.StatusSeeOther)
	}
}

func (app *Application) loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" {
		app.renderTemplate(w, "login", nil)
		return
	}

	if r.Method == "POST" {
		// Parse form data
		err := r.ParseForm()
		if err != nil {
			http.Error(w, "Error parsing form", http.StatusBadRequest)
			return
		}

		username := r.Form.Get("username")
		password := r.Form.Get("password")

		// Verify user credentials
		var user User
		err = app.db.QueryRow(`
			SELECT id, username, password, type, email, balance 
			FROM users 
			WHERE username = ?
		`, username).Scan(&user.ID, &user.Username, &user.Password, &user.Type, &user.Email, &user.Balance)
		if err != nil {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		// Check password
		err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
		if err != nil {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		// Create session
		session, _ := app.sessionStore.Get(r, "session")
		session.Values["user_id"] = user.ID
		session.Values["user_type"] = user.Type
		session.Save(r, w)

		// Redirect to dashboard
		http.Redirect(w, r, "/dashboard", http.StatusSeeOther)
	}
}

func (app *Application) dashboardHandler(w http.ResponseWriter, r *http.Request) {
	// Get user from session
	session, _ := app.sessionStore.Get(r, "session")
	userID, ok := session.Values["user_id"].(int)
	if !ok {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	// Fetch user details
	var user User
	err := app.db.QueryRow(`
		SELECT id, username, email, balance, type 
		FROM users 
		WHERE id = ?
	`, userID).Scan(&user.ID, &user.Username, &user.Email, &user.Balance, &user.Type)
	if err != nil {
		http.Error(w, "User not found", http.StatusInternalServerError)
		return
	}

	// Fetch user's loans
	var loans []Loan
	var query string
	var rows *sql.Rows

	if user.Type == "borrower" {
		query = "SELECT id, amount, interest_rate, status, created_at FROM loans WHERE borrower_id = ?"
		rows, err = app.db.Query(query, userID)
	} else {
		query = "SELECT id, borrower_id, amount, interest_rate, status, created_at FROM loans WHERE status = 'PENDING'"
		rows, err = app.db.Query(query)
	}

	if err != nil {
		http.Error(w, "Error fetching loans", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var loan Loan
		if user.Type == "borrower" {
			err = rows.Scan(&loan.ID, &loan.Amount, &loan.InterestRate, &loan.Status, &loan.CreatedAt)
		} else {
			err = rows.Scan(&loan.ID, &loan.BorrowerID, &loan.Amount, &loan.InterestRate, &loan.Status, &loan.CreatedAt)
		}
		if err != nil {
			break
		}
		loans = append(loans, loan)
	}

	// Prepare data for template
	data := struct {
		User  User
		Loans []Loan
	}{
		User:  user,
		Loans: loans,
	}

	app.renderTemplate(w, "dashboard", data)
}

func (app *Application) createLoanHandler(w http.ResponseWriter, r *http.Request) {
	// Get user from session
	session, _ := app.sessionStore.Get(r, "session")
	userID, ok := session.Values["user_id"].(int)
	if !ok {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	if r.Method == "GET" {
		app.renderTemplate(w, "create-loan", nil)
		return
	}

	if r.Method == "POST" {
		// Parse form data
		err := r.ParseForm()
		if err != nil {
			http.Error(w, "Error parsing form", http.StatusBadRequest)
			return
		}

		amount := r.Form.Get("amount")
		interestRate := r.Form.Get("interest_rate")

		// Insert loan into database
		_, err = app.db.Exec(`
			INSERT INTO loans (borrower_id, amount, interest_rate, status, created_at) 
			VALUES (?, ?, ?, ?, ?)
		`, userID, amount, interestRate, "PENDING", time.Now())
		if err != nil {
			http.Error(w, "Error creating loan", http.StatusInternalServerError)
			return
		}

		// Redirect to dashboard
		http.Redirect(w, r, "/dashboard", http.StatusSeeOther)
	}
}

// Render template with optional data
func (app *Application) renderTemplate(w http.ResponseWriter, tmpl string, data interface{}) {
	t, ok := app.templateCache[tmpl]
	if !ok {
		http.Error(w, "Template not found", http.StatusInternalServerError)
		return
	}

	err := t.ExecuteTemplate(w, "base", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// Logout handler
func (app *Application) logoutHandler(w http.ResponseWriter, r *http.Request) {
	session, _ := app.sessionStore.Get(r, "session")
	session.Values["user_id"] = nil
	session.Save(r, w)
	http.Redirect(w, r, "/login", http.StatusSeeOther)
}

// Setup routes
func (app *Application) routes() *mux.Router {
	r := mux.NewRouter()

	// Static files
	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("./static"))))

	// Public routes
	r.HandleFunc("/", app.homeHandler).Methods("GET")

	// Authentication routes
	r.HandleFunc("/register", app.registerHandler).Methods("GET", "POST")
	r.HandleFunc("/login", app.loginHandler).Methods("GET", "POST")
	r.HandleFunc("/logout", app.logoutHandler).Methods("GET")

	// Protected routes
	r.HandleFunc("/dashboard", app.dashboardHandler).Methods("GET")
	r.HandleFunc("/create-loan", app.createLoanHandler).Methods("GET", "POST")

	return r
}

func main() {
	// Set session key if not set
	if os.Getenv("SESSION_KEY") == "" {
		os.Setenv("SESSION_KEY", "your-secret-key-here-change-in-production")
	}

	// Initialize application
	app := NewApplication()
	defer app.db.Close()

	// Setup and start server
	port := 8080
	log.Printf("Server starting on port %d", port)
	
	// Start server
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", port),
		Handler:      app.routes(),
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	log.Fatal(server.ListenAndServe())
}