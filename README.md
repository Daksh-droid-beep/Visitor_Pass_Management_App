# VisiFlow - Visitor Pass Management System (MERN Stack)

VisiFlow is a production-quality, full-stack digital Visitor Pass Management System designed to replace manual registers in office buildings, institutions, and co-working spaces. It facilitates visitor pre-registration, host/employee approval, secure QR pass issuance, check-in/check-out logs, automated email PDF badges, and administrative analytics.

---

## Key Features

- **Multi-Role Auth**: Role-Based Access Control (RBAC) supporting `ADMIN`, `EMPLOYEE` (Host), `SECURITY` (Front Desk), and `VISITOR`.
- **OTP Verification**: Multi-factor signup activation via 6-digit email OTPs.
- **Pass QR Codes**: Unique security-valid QR codes generated automatically upon host approval.
- **PDF Badges (PDFKit)**: Compact A6-sized card badges with visitor photo, schedule, and QR code, automatically mailed to visitors.
- **Gate Control Scanner**: Security personnel dashboard with integrated webcam QR code reading (`react-qr-scanner`) and manual override.
- **Audit Logging**: Active entrance/exit audit logging with officer attribution.
- **Analytics Charts (Chart.js)**: Admin visualization charts detailing monthly visit volumes, status spreads, and department workloads.
- **Dockerized Environment**: Ready-to-go multi-container orchestration.

---

## Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS, React Router v6, Axios, React Hook Form, React QR Scanner, Chart.js.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT, Bcrypt, Multer, Nodemailer, PDFKit, QRCode.
- **Database**: MongoDB Atlas / local MongoDB.

---

## Directory Structure

```
Visitor_Pass_Management_App/
├── backend/
│   ├── src/
│   │   ├── config/          # Db connection, nodemailer transporter, multer setup
│   │   ├── controllers/     # Controller logic for auth, visitors, appointments, passes, check-in
│   │   ├── middlewares/     # JWT authentication, role check, error handling
│   │   ├── models/          # Mongoose schemas (User, Visitor, Appointment, Pass, CheckLog)
│   │   ├── routes/          # Express route registration
│   │   ├── services/        # Business logic (QR Code, PDFKit, Nodemailer)
│   │   ├── utils/           # Helper functions (JWT token signers)
│   │   └── uploads/         # Storage for uploaded files (profile photos, passes)
│   ├── server.js            # Main backend entry point
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # Sidebar, Navbar, Route Guards, Layouts
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # Public pages, Visitor, Host, Security, Admin dashboards
│   │   ├── services/        # Axios API clients
│   │   ├── App.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Environment Variables

### Backend (`backend/.env`)
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/visitor-pass-db
JWT_SECRET=dev_jwt_access_secret_998877665544
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_112233445566
FRONTEND_URL=http://localhost:5173

# Email Configurations for Nodemailer (SMTP credentials)
# Leave empty to auto-generate Ethereal Email test account inside the console logs
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM="Visitor Pass System" <no-reply@visitorpass.com>
```

---

## API Documentation

### Auth & User (`/api/auth`)
- `POST /register` — Register a User. Supports multipart-form data with `profilePhoto` image.
- `POST /login` — Login user. Returns access JWT, refresh token, and user details.
- `POST /send-otp` — Generates and emails verification OTP.
- `POST /verify-otp` — Verifies OTP, sets `isVerified = true`.
- `GET /profile` — Returns current logged-in user profile (JWT protected).
- `GET /employees` — Lists all employees for the visitor host selector (JWT protected).
- `GET /users` — Lists all system users (Admin only).
- `DELETE /users/:id` — Deletes system user (Admin only).

### Visitor Profile (`/api/visitors`)
- `POST /` — Creates a visitor request profile (multipart form, field: `photo`).
- `GET /` — Fetches visitors (filtered by host if Host role, user if Visitor, all if Admin/Security).
- `GET /:id` — Fetches single visitor details.
- `PUT /:id` — Updates visitor details (host/admin only).
- `DELETE /:id` — Deletes visitor profile.

### Appointment (`/api/appointments`)
- `POST /` — Creates a visit booking request.
- `GET /` — Fetches appointments (filtered by role).
- `PUT /:id/approve` — Approves appointment. Triggers QR code generation, compiles PDF Badge, emails PDF pass to visitor, and creates a Pass document.
- `PUT /:id/reject` — Declines appointment. Sends rejection notification.

### Passes (`/api/pass`)
- `POST /generate` — Generates a pass manually for approved appointments (Admin/Security).
- `GET /` — Lists all passes (Admin/Security).
- `GET /:id` — Fetches a single pass by pass ID, visitor ID, or appointment ID.
- `GET /download/:id` — Public PDF stream attachment for badge downloads.

### Security Gates (`/api/checkin`, `/api/checkout`, `/api/logs`)
- `POST /api/checkin` — Check-in visitor via pass number. Verifies pass status and records entry logs.
- `POST /api/checkout` — Check-out visitor, records exit timestamps, and deactivates current pass.
- `GET /api/logs` — Lists physical gate check logs (Security/Admin).

---

## Setup & Running Locally

### Step 1: Clone & Navigate
```bash
cd Visitor_Pass_Management_App
```

### Step 2: Install and Run Backend
1. Open a terminal and navigate to the backend:
   ```bash
   cd backend
   npm install
   ```
2. Seed the database with sample metrics (Admin, 5 Employees, 3 Security, 20 Visitors, mock logs/passes):
   ```bash
   npm run seed
   ```
3. Run in development server mode:
   ```bash
   npm run dev
   ```

### Step 3: Install and Run Frontend
1. Open another terminal and navigate to the frontend:
   ```bash
   cd frontend
   npm install
   ```
2. Run Vite dev server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Running via Docker Compose

VisiFlow is completely containerized. Simply run the following command from the root folder:
```bash
docker-compose up --build
```
This spins up:
- MongoDB at `localhost:27017`
- Express API server at `localhost:5000`
- React Frontend served through Nginx at `localhost:5173`

---

## Demo Credentials

The following demo accounts are provided for project evaluation and testing. Reviewers and evaluators can log in using these credentials to verify role-specific dashboards, workflows, and permissions. All passwords are **`password123`**.

| Role | Primary Email | Password | Additional Demo Accounts / Range |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@visitorpass.com` | `password123` | Full system access |
| **EMPLOYEE** (Host) | `employee1@visitorpass.com` | `password123` | Available hosts: `employee1` through `employee5` |
| **SECURITY** (Front Desk) | `security1@visitorpass.com` | `password123` | Available guards: `security1` through `security3` |
| **VISITOR** (Registered) | `visitor1@visitorpass.com` | `password123` | Available visitors: `visitor1` through `visitor10` |
