# Community Library Lending System

Welcome to the Community Library Lending System, a full-stack web application designed for a small community library to manage book cataloging, member checkouts, waitlist queues, reservation fulfillment, and late fee management.

The system is built with a **Spring Boot java backend** and a **Next.js frontend**, using **PostgreSQL** as the relational database.

---

## 🛠️ Technology Stack
*   **Backend**: Java 17+, Spring Boot 3.4.x, Spring Security (JWT-based session authentication), Spring Data JPA, Hibernate, Flyway DB Migrations, Maven.
*   **Frontend**: React, Next.js (App Router, Client Components), TypeScript, Tailwind CSS, Lucide icons, Axios, TanStack Query (React Query).
*   **Database**: PostgreSQL 16.
*   **Containerization**: Docker & Docker Compose.

---

## 🚀 Setup, Installation & Run Instructions

You can run the application either using **Docker Compose** (recommended, runs both backend and frontend automatically) or **locally in development mode**.

### Method 1: Running with Docker Compose (Recommended)
This method spins up the frontend, backend, and PostgreSQL database within a unified network.

1.  **Clone or navigate** to the project root directory: `d:\Games\ScheditGlobal`
2.  **Run the following command** to build and start all containers under a background daemon:
    ```bash
    docker-compose up -d --build
    ```
3.  **Wait for the database and backend schema initialization** to complete. You can inspect container logs via:
    ```bash
    docker-compose logs -f library-backend
    ```
4.  **Access the Application**:
    *   **Frontend web interface**: [http://localhost:3000](http://localhost:3000)
    *   **Backend API endpoint**: Use [http://localhost:8081](http://localhost:8081)
    *   **Backend API Documentation**: Open Swagger UI at [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html) to interact with the raw endpoints.

To stop the containers and keep the data:
```bash
docker-compose down
```

---

### Method 2: Running Locally in Development Mode
To run individual services without Docker, make sure you have **Node.js (v18+)**, **JDK 17**, and a running **PostgreSQL** instance.

#### 1. PostgreSQL Database Setup
Create a PostgreSQL database named `library_db` running on port `5432`:
*   **URL**: `jdbc:postgresql://localhost:5432/library_db`
*   **Username (default)**: `postgres`
*   **Password (default)**: `postgres`

#### 2. Running the Backend
1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Build the Maven project:
    ```bash
    mvn clean install
    ```
3.  Start the Spring Boot application:
    ```bash
    mvn spring-boot:run
    ```
    The application will run on port `8080` (or `8081` when custom configured). Flyway will run schema migrations and automatically seed the database on startup.

#### 3. Running the Frontend
1.  Open a new terminal and navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Next.js development server:
    ```bash
    npm run dev
    ```
    Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

---

## 🔑 Mock Identities & Passwords
To simulate multi-user behavior, the application includes an **Acting As** identity selector in the top-right header of the frontend layout. This selector enables you to switch between different librarian and member roles.

All pre-seeded mock users share the same login password:
Password: **`password`**

### Seeded Librarian Accounts
Librarians have permission to add new books/copies, mark copy states (such as Damaged or Lost), view the waitlists, and waive or pay off late fees.

| Name | Role | Email |
| :--- | :--- | :--- |
| **Sarah Johnson** | Librarian | `sarah.lib@library.com` |
| **Mark Smith** | Librarian | `mark.lib@library.com` |

### Seeded Member Accounts
Members can search/browse the catalog, checkout booklets, renew loans, join or cancel waitlists, and view their dashboard containing current active loans and fines.

| Name | Membership Tier | Borrow Limit | Loan Duration | Email |
| :--- | :--- | :--- | :--- | :--- |
| **John (Regular)** | Regular | 3 Books | 14 Days | `john.reg@library.com` |
| **Alice (Supporting)** | Supporting | 6 Books | 28 Days | `alice.sup@library.com` |
| **Bob (Regular)** | Regular | 3 Books | 14 Days | `bob.reg@library.com` |
| **Diana (Supporting)** | Supporting | 6 Books | 28 Days | `diana.sup@library.com` |

---

## 📖 Key Rules and Business Logic

The backend system strictly enforces rules to match real-world library constraints:

1.  **Borrowing Limits**:
    *   **Regular Members**: Can borrow up to **3 books** concurrently.
    *   **Supporting Members**: Can borrow up to **6 books** concurrently.
2.  **Fine Restrictions**: Members with outstanding late fees (status `OWED`) are **blocked** from checking out any more books until their fees are fully paid or waived.
3.  **Fines Calculation**: Overdue items incur a daily charge of **$0.50**. Fines are automatically calculated upon returning the book, and are **capped** at the replacement cost of the book title.
4.  **Waiting Lists & Reservations**:
    *   If a book has no available copies, members can join a FIFO waiting list.
    *   **Waitlist Rule**: You can only join a waiting list if you do not currently have the book out on loan, and you cannot join the same waitlist more than once.
    *   When another member returns a copy, it is automatically assigned to the first person on the waitlist. That copy status transitions to `RESERVED` and the reservation becomes `READY_FOR_PICKUP`.
    *   The reserved member has **3 days** to collect the book. If they fail to borrow it within 3 days, their reservation expires, and the copy is automatically assigned to the next member on the waiting list.
5.  **Renewal Constraints**: Members can renew their loans to extend their due date. However, renewals are **blocked** if there is another member waiting on the waitlist for that book.
6.  **Admin Tools**: Librarians can edit membership tiers and mark book copies as `LOST` or `DAMAGED`. If a copy is marked lost/damaged, its corresponding reservation queue updates automatically to preserve fairness.

---

## 🧪 Step-by-Step Scenario: Testing All Features

Follow this scenario manually inside the web browser to test every aspect of the application flow:

### Step 1: Browse the Catalog (Guest Mode)
1.  Load [http://localhost:3000](http://localhost:3000). By default, you are a Guest.
2.  You can browse the seeded catalog (e.g. *The Hobbit*, *To Kill a Mockingbird*, *1984*). Click on details but note that checkout/action buttons are disabled in Guest mode.

### Step 2: Borrow a Book (Member Flow)
1.  In the header, click the **Member** button.
2.  Select **John (Regular)** from the dropdown. Enter password **`password`** and click **Login** (or press Enter).
3.  Go to the Catalog, find *1984* (seeded with 1 copy total), and select **Borrow**.
4.  Verify that *1984* is successfully checked out to John. If you check *1984*'s page again, available copies will read `0`.

### Step 3: Join the Waitlist (FIFO Reservation Flow)
1.  With John still logged in, try to join the waitlist for *1984*. Notice that you **cannot** join the waitlist for a book you currently have checked out.
2.  In the header, click John's profile dropdown and select logout.
3.  Click the **Member** button, select **Alice (Supporting)**, enter password **`password`**, and log in.
4.  Search for *1984*. Since available copies are `0`, click **Join Waitlist**.
5.  With Alice still logged in, click logout. Login as **Bob (Regular)** (password: `password`).
6.  Go to *1984* and click **Join Waitlist**.
7.  Verify on *1984*'s detail page that the waitlist queue lists Alice first, followed by Bob.

### Step 4: Auto-Promotion on Return
1.  Log out of Bob. Login as **John (Regular)** (password: `password`).
2.  Go to your User Dashboard (via your profile in the header). Under "Active Loans", click **Return** for *1984*.
3.  Log out of John. Log in to **Alice (Supporting)** (password: `password`).
4.  Go to Alice's dashboard. A notification and active reservation will show *1984* is status `READY_FOR_PICKUP` with a collection deadline (3 days from now).
5.  Bob (who is second in queue) cannot borrow this copy because it is reserved for Alice.

### Step 5: Check Out the Reserved Copy
1.  While logged in as Alice, navigate to the catalog page for *1984*.
2.  Click **Borrow Reserved Copy**.
3.  Verify that the copy is now checked out to Alice.

### Step 6: Book Copy Satuses and Fines (Librarian Flow)
1.  Log out of Alice. Log in as **Sarah Johnson** (Librarian) with password **`password`**.
2.  Go to the Member Directory and search for members.
3.  Add a new Book title or click on *The Hobbit* copy manager.
4.  Mark a copy of *The Hobbit* as **Lost** or **Damaged**.
5.  In the "System Fines" panel, librarians can pay off or waive outstanding late fee fines accrued by members.
