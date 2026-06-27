# Bank Account App

A full-stack banking demo built with **Spring Boot 4** (Java 25) and **Angular 21**.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)

## Running locally

```bash
# Clone the repository and navigate to the project root
cd bank-account-app

# Build images and start all services
docker compose up --build
```

This starts three containers:

| Container         | Description              | Port   |
| ----------------- | ------------------------ | ------ |
| `bank-postgres`   | PostgreSQL 16 database   | `5432` |
| `account-service` | Spring Boot REST API     | `8080` |
| `account-ui`      | Angular frontend (nginx) | `4200` |

Database schema is applied automatically by Flyway on first startup.

### Stopping

```bash
docker compose down
```

To also remove the database volume (full reset):

```bash
docker compose down -v
```

## Accessing the application

| URL                                         | Description                |
| ------------------------------------------- | -------------------------- |
| http://localhost:4200                       | Angular UI                 |
| http://localhost:8080/swagger-ui/index.html | Swagger UI (REST API docs) |
| http://localhost:8080/v3/api-docs           | Raw OpenAPI JSON           |

## Accessing the database

The PostgreSQL database is exposed on **port 5432**. Connect with any client (e.g. psql, DBeaver, DataGrip):

| Field    | Value       |
| -------- | ----------- |
| Host     | `localhost` |
| Port     | `5432`      |
| Database | `bankdb`    |
| Username | `bankuser`  |
| Password | `bankpass`  |

```bash
# via psql
psql -h localhost -p 5432 -U bankuser -d bankdb
```

## API overview

All endpoints under `/api/accounts/**` and `/api/transactions/**` require a **Bearer JWT** token.

1. Open **Swagger UI** at http://localhost:8080/swagger-ui/index.html
2. Expand **Auth → POST /auth/register**, click **Try it out**, fill in a username/email/password, and execute. Copy the `token` value from the response body.  
   _(Or use **POST /auth/login** if you already have an account.)_
3. Scroll to the **top of the Swagger UI page**. Click the green **Authorize 🔓** button — it is in the top-right area of the page, just above the list of endpoints.
4. In the dialog that opens, paste **only the token** (without the word `Bearer`) into the **bearerAuth** field and click **Authorize**, then **Close**.
5. All locked endpoints (shown with a closed padlock 🔒) are now accessible.
