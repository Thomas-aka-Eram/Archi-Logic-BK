# Archi MVP - API Documentation & Testing Guide

This document provides a complete guide for testing the Archi MVP backend API. It includes an overview of the available features, a full list of endpoints, and a step-by-step testing flow with ready-to-use cURL commands that you can copy/paste into your terminal or import into an API client like Insomnia or Postman.

**Note:** The API currently uses a mock user ID (`a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11`) for authenticated actions. In a production environment, this would be replaced by a proper authentication system.

## Implemented MVP Features

Based on the provided specification, the current system implements the following core features:

1.  **Core Data Model & User/Project Management**: Secure user accounts, project containers, and membership mapping.
2.  **Notebook Editor & Block Versioning**: Create documents and versioned blocks of content within them.
3.  **Task Management**: Create tasks with assignees and dependencies.
4.  **Hierarchical Tagging**: Create and manage a structured tagging system.
5.  **GitHub Webhook Integration**: Process GitHub push events to link commits to tasks.
6.  **Review & Approval Workflow**: Request and approve reviews for content blocks.
7.  **Full-Text Search**: Search for content across documents and blocks.
8.  **Smart Assignment (Foundation)**: The backend logic for suggesting task assignees is in place.

## Testing Flow

The API entities are interconnected. For example, you cannot create a document without a project first. Follow these steps in order to test the API effectively.

**Testing Data Placeholders:**
In the examples below, you will see placeholders like `{{PROJECT_ID}}`, `{{DOCUMENT_ID}}`, etc. You need to replace these with the actual `id` values you receive from the API in the preceding steps.

1.  **Create a User**: Start by creating a user account.
2.  **Create a Project**: Create a project for the user.
3.  **Create Tags**: Add some tags to the project.
4.  **Create a Document**: Add a document to the project.
5.  **Add Blocks**: Add content blocks to the document.
6.  **Create Tasks**: Create tasks within the project.
7.  **Manage Repositories & Webhooks**: Link a repository and simulate a webhook event.

---

## API Endpoints

###  sehat Users

#### 1. Create a New User

Creates a new user in the system.

-   **Method**: `POST`
-   **Endpoint**: `/users`
-   **Body**: `application/json`

**cURL Command:**
```bash
curl --location 'http://localhost:3000/users' \
--header 'Content-Type: application/json' \
--data '{
    "name": "Test User",
    "email": "test.user@example.com",
    "password": "a-very-secure-password"
}'
```

###  sehat Projects

#### 1. Create a New Project

Creates a new project. The user making the request will be the project owner.

-   **Method**: `POST`
-   **Endpoint**: `/projects`
-   **Body**: `application/json`

**cURL Command:**
```bash
curl --location 'http://localhost:3000/projects' \
--header 'Content-Type: application/json' \
--data '{
    "name": "E-Commerce Platform MVP",
    "description": "This project is for the initial development of the new e-commerce platform.",
    "phases": [
        { "key": "REQUIREMENTS", "title": "Requirements", "orderIndex": 1 },
        { "key": "DESIGN", "title": "Design", "orderIndex": 2 },
        { "key": "DEVELOPMENT", "title": "Development", "orderIndex": 3 }
    ]
}'
```
> **Save the `id` from the response as `{{PROJECT_ID}}` for subsequent requests.**

#### 2. Add a Member to a Project

Adds an existing user to a project with a specific role.

-   **Method**: `POST`
-   **Endpoint**: `/projects/{{PROJECT_ID}}/members`
-   **Body**: `application/json`

**cURL Command:**
```bash
# First, create a second user to add to the project.
# Then, replace {{PROJECT_ID}} and the userId with the correct values.
curl --location 'http://localhost:3000/projects/{{PROJECT_ID}}/members' \
--header 'Content-Type: application/json' \
--data '{
    "userId": "ID_OF_THE_SECOND_USER",
    "role": "DEVELOPER"
}'
```

#### 3. Get Project Phases

Retrieves the configured SDLC phases for a project.

-   **Method**: `GET`
-   **Endpoint**: `/projects/{{PROJECT_ID}}/phases`

**cURL Command:**
```bash
curl --location 'http://localhost:3000/projects/{{PROJECT_ID}}/phases'
```

### sehat Tags

#### 1. Create a Tag in a Project

Creates a new tag within a specific project.

-   **Method**: `POST`
-   **Endpoint**: `/tags/project/{{PROJECT_ID}}`
-   **Body**: `application/json`

**cURL Command:**
```bash
curl --location 'http://localhost:3000/tags/project/{{PROJECT_ID}}' \
--header 'Content-Type: application/json' \
--data '{
    "name": "Authentication",
    "slug": "auth",
    "color": "#FF5733"
}'
```
> **Save the `id` from the response as `{{TAG_ID}}` for subsequent requests.**

### sehat Documents & Blocks

#### 1. Create a Document

Creates a new document within a project and assigns it to a phase.

-   **Method**: `POST`
-   **Endpoint**: `/documents/project/{{PROJECT_ID}}`
-   **Body**: `application/json`

**cURL Command:**
```bash
curl --location 'http://localhost:3000/documents/project/{{PROJECT_ID}}' \
--header 'Content-Type: application/json' \
--data '{
    "title": "User Authentication Flow",
    "phaseKey": "DESIGN"
}'
```
> **Save the `id` from the response as `{{DOCUMENT_ID}}` for subsequent requests.**

#### 2. Add a Block to a Document

Adds a new, versioned content block to a document.

-   **Method**: `POST`
-   **Endpoint**: `/documents/{{DOCUMENT_ID}}/blocks`
-   **Body**: `application/json`

**cURL Command:**
```bash
curl --location 'http://localhost:3000/documents/{{DOCUMENT_ID}}/blocks' \
--header 'Content-Type: application/json' \
--data '{
    "type": "markdown",
    "title": "OAuth 2.0 Integration",
    "content": "The system must support Google and GitHub as OAuth 2.0 providers.",
    "tags": ["{{TAG_ID}}"]
}'
```
> **Save the `blockGroupId` from the response as `{{BLOCK_GROUP_ID}}` for subsequent requests.**

#### 3. Update a Block

Updates a block by creating a new version.

-   **Method**: `PATCH`
-   **Endpoint**: `/documents/blocks/{{BLOCK_GROUP_ID}}`
-   **Body**: `application/json`

**cURL Command:**
```bash
curl --location --request PATCH 'http://localhost:3000/documents/blocks/{{BLOCK_GROUP_ID}}' \
--header 'Content-Type: application/json' \
--data '{
    "content": "The system must support Google, GitHub, and GitLab as OAuth 2.0 providers.",
    "message": "Added GitLab support requirement."
}'
```

#### 4. Get All Blocks for a Document

Retrieves all the current blocks within a document.

-   **Method**: `GET`
-   **Endpoint**: `/documents/{{DOCUMENT_ID}}/blocks`

**cURL Command:**
```bash
curl --location 'http://localhost:3000/documents/{{DOCUMENT_ID}}/blocks'
```

### sehat Tasks

#### 1. Create a Task

Creates a new task within a project.

-   **Method**: `POST`
-   **Endpoint**: `/tasks/project/{{PROJECT_ID}}`
-   **Body**: `application/json`

**cURL Command:**
```bash
curl --location 'http://localhost:3000/tasks/project/{{PROJECT_ID}}' \
--header 'Content-Type: application/json' \
--data '{
    "title": "Implement Google OAuth Login",
    "description": "Set up the backend API and database to handle Google OAuth callbacks.",
    "tags": ["{{TAG_ID}}"],
    "estimateHours": 8,
    "assignees": [
        { "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "role": "Assignee" }
    ]
}'
```
> **Save the `id` from the response as `{{TASK_ID}}` for subsequent requests.**

#### 2. Update a Task

Updates the details of an existing task.

-   **Method**: `PATCH`
-   **Endpoint**: `/tasks/{{TASK_ID}}`
-   **Body**: `application/json`

**cURL Command:**
```bash
curl --location --request PATCH 'http://localhost:3000/tasks/{{TASK_ID}}' \
--header 'Content-Type: application/json' \
--data '{
    "status": "IN_PROGRESS"
}'
```

### sehat Repositories & Webhooks

#### 1. Add a Repository to a Project

Links a GitHub repository to a project.

-   **Method**: `POST`
-   **Endpoint**: `/repositories/project/{{PROJECT_ID}}`
-   **Body**: `application/json`

**cURL Command:**
```bash
curl --location 'http://localhost:3000/repositories/project/{{PROJECT_ID}}' \
--header 'Content-Type: application/json' \
--data '{
    "name": "my-org/e-commerce-backend",
    "webhookSecret": "a-very-strong-and-random-secret"
}'
```

#### 2. GitHub Webhook Listener

This is the endpoint you provide to GitHub to receive push events. It requires a valid signature and a JSON payload matching GitHub's format. Testing this requires a tool that can generate the correct `X-Hub-Signature-256` header, or a live GitHub repository.

-   **Method**: `POST`
-   **Endpoint**: `/webhooks/github`
-   **Headers**: `X-Hub-Signature-256`, `X-GitHub-Event: push`

### sehat Search

#### 1. Search for Blocks

Performs a full-text search across all block content.

-   **Method**: `GET`
-   **Endpoint**: `/search?q=<search_term>`

**cURL Command:**
```bash
curl --location 'http://localhost:3000/search?q=oauth'
```
