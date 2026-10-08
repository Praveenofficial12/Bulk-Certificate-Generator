# 🏆 Bulk Certificate Generator

> **Generate hundreds of professional certificates in minutes.**
> Upload recipients → validate data → generate PDFs → download → verify.

🌐 **Live App:** https://bulk-certificate-generator.space-z.ai/
💻 **Repository:** https://github.com/Praveenofficial12/Bulk-Certificate-Generator

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white) ![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite&logoColor=white) ![Bun](https://img.shields.io/badge/Bun-Runtime-f9f1e1?logo=bun&logoColor=black)

---

## ✨ Overview

Bulk Certificate Generator is a full-stack web application for organizations that need to create and manage large numbers of certificates without manually designing and exporting every certificate.

It turns a recipient spreadsheet into a complete certificate workflow:

**Recipient data → Validation → Bulk generation → PDF certificates → ZIP/report → Verification**

Built for colleges, universities, schools, companies, training institutes, hackathons, webinars, internships, workshops, conferences, competitions, and event organizers.

## 🚀 Highlights

| Capability | Description |
|---|---|
| 📥 CSV / Excel Import | Import recipient lists and map certificate fields |
| 👥 Recipient Management | Search, edit, import, and manage recipient records |
| 🎨 Templates | Professional built-in templates plus custom template support |
| ⚡ Bulk Generation | Process large certificate batches through generation jobs |
| 📊 Live Progress | Track processed, successful, failed, and remaining records |
| 📦 ZIP Export | Download an entire batch as a ZIP archive |
| 📑 Reports | Generate CSV reports for each generation job |
| 🔐 Verification | Unique certificate IDs and verification tokens |
| 📱 QR Codes | QR codes can link directly to certificate verification |
| 📈 Analytics | Generation trends, success rates, template usage, and events |
| 🧑‍💼 Roles | Admin and Staff access model |
| 🔑 Authentication | bcrypt password hashing and JWT authentication |
| 📝 Activity Logs | Track important application and generation events |
| 🔔 Notifications | User-specific information, success, warning, and error messages |

## 🧭 How It Works

### 1. Upload
Import recipients from CSV or Excel files. Supported data can include name, email, phone, registration ID, department, institution, event, role, and custom fields.

### 2. Validate
Review recipient data before generation so missing or invalid records can be identified.

### 3. Configure
Choose a certificate template and configure organization, event, title, date, venue, duration, signatory details, certificate ID prefix, file naming, paper size, orientation, and QR verification.

### 4. Generate
A Generation Job is created and processed in the background. Progress and success/failure counts are recorded while certificates are generated.

### 5. Download & Verify
Download individual PDFs or a complete ZIP/report. Each generated certificate can carry a unique certificate ID, verification token, verification URL, and QR code.

## 🏗️ Architecture

```text
┌────────────────────────────────────────────────────────────┐
│                 Next.js + React + TypeScript              │
│                    Web Application                        │
└─────────────────────────────┬──────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                     API / Application Layer                │
│ Auth • Recipients • Templates • Jobs • Certificates       │
│ Analytics • Activity Logs • Settings • Verification       │
└───────────────┬──────────────────────┬─────────────────────┘
                │                      │
                ▼                      ▼
       ┌────────────────┐     ┌────────────────────────┐
       │ Prisma +       │     │ Certificate Engine     │
       │ SQLite         │     │ PDF • QR • Templates   │
       │ Users • Jobs   │     │ A4/Letter • Layouts    │
       │ Recipients     │     │ Background Images      │
       │ Certificates   │     └────────────┬───────────┘
       └────────────────┘                  │
                                           ▼
                              ┌────────────────────────┐
                              │ File Storage            │
                              │ PDFs • ZIPs • Reports   │
                              └────────────────────────┘
```

## 🧩 Project Structure

```text
Bulk-Certificate-Generator/
├── src/
│   ├── app/
│   │   └── api/
│   ├── components/
│   ├── hooks/
│   └── lib/
│       ├── auth.ts
│       ├── bulk-worker.ts
│       ├── certificate-config.ts
│       ├── certificate-engine.ts
│       ├── db.ts
│       ├── parse.ts
│       └── utils.ts
├── prisma/
│   └── schema.prisma
├── public/
├── tests/
├── examples/
├── mini-services/
├── db/
├── download/
├── package.json
├── bun.lock
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── Caddyfile
└── tsconfig.json
```

## 🎨 Certificate Engine

The PDF engine is built with pdf-lib and supports:

- A4 and Letter paper
- Portrait and landscape layouts
- Built-in template configurations
- Custom background images
- Decorative borders
- Organization branding
- Automatic recipient-name sizing
- Event and recipient metadata
- Signatory details
- Certificate IDs
- Verification tokens
- QR code generation
- PDF output

Because the certificates are generated from structured data, one template can produce hundreds of personalized PDFs automatically.

## 🗃️ Data Model

The Prisma database is organized around the certificate lifecycle:

**User → Generation Jobs → Certificates**

Additional entities include **Organization, Template, Recipient, ActivityLog, Notification, and Setting**.

Generation jobs track total recipients, processed records, successful records, failures, progress percentage, status, output files, reports, and timestamps.

## 🔐 Security

The application includes:

- bcrypt password hashing
- JWT authentication
- Admin / Staff role separation
- Protected application routes
- File upload validation
- Safe file-name handling
- Unique certificate verification tokens
- Public certificate verification flow
- Activity logging

### ⚠️ Protect your environment variables

Never commit production secrets to GitHub. Keep your local .env file outside the repository and configure environment variables in your deployment platform.

Typical configuration includes DATABASE_URL, JWT_SECRET, and FRONTEND_URL.

## 💻 Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Radix UI
- Framer Motion
- Lucide React
- TanStack React Query
- Recharts
- React Hook Form

### Backend & Data
- Next.js API routes
- Prisma ORM
- SQLite
- JWT
- bcryptjs

### Generation & Processing
- pdf-lib
- @pdf-lib/fontkit
- qrcode
- JSZip
- PapaParse
- XLSX
- Sharp

### Runtime
- Bun

## ⚙️ Local Setup

### Prerequisites

Install Git and Bun before starting.

### Clone the repository

    git clone https://github.com/Praveenofficial12/Bulk-Certificate-Generator.git
    cd Bulk-Certificate-Generator

### Install dependencies

    bun install

### Configure environment

Create a local .env file with values appropriate for your environment. For example:

    DATABASE_URL="file:./db/custom.db"
    JWT_SECRET="replace-with-a-long-random-secret"
    FRONTEND_URL="http://localhost:3000"

### Prepare Prisma

    bun run db:generate
    bun run db:push

### Start development

    bun run dev

Open http://localhost:3000 in your browser.

## 📦 Production

Build:

    bun run build

Start:

    bun run start

Lint:

    bun run lint

## 📊 Generation Job Lifecycle

```text
PENDING
   ↓
PROCESSING
   ├──→ COMPLETED
   ├──→ PARTIALLY_COMPLETED
   ├──→ FAILED
   └──→ CANCELLED
```

Individual certificate records can be tracked as PENDING, GENERATED, or FAILED.

## 🌐 Live Application

### [🚀 Open Bulk Certificate Generator](https://bulk-certificate-generator.space-z.ai/)

Use the deployed application to explore the certificate workflow and dashboard.

## 🛣️ Future Roadmap

- ☁️ External object storage for generated files and uploaded assets
- 🗄️ PostgreSQL support for larger production deployments
- 📧 Automated certificate email delivery
- 🖱️ More advanced drag-and-drop template editing
- 👥 More granular organization and team permissions
- 📊 Expanded reporting and analytics
- 🔄 Durable background queues
- 🌍 Multi-organization / multi-tenant support
- 🧪 Expanded automated test coverage
- 🔔 Real-time job updates

## ⚠️ Production Storage Note

The current project uses SQLite and local filesystem storage. That is convenient for development and smaller deployments, but a production deployment on an ephemeral filesystem should use persistent storage or external object storage for generated PDFs, ZIP files, reports, and uploaded assets.

For larger multi-user deployments, consider a managed PostgreSQL database.

## 🤝 Contributing

Contributions and improvements are welcome.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting/tests
5. Commit your changes
6. Push your branch
7. Open a Pull Request

## 📄 License

No open-source license is currently specified in this repository. Add a LICENSE file if you plan to grant others formal reuse, modification, or redistribution rights.

## ⭐ Support

If you find this project useful, consider starring the repository, reporting issues, suggesting improvements, or contributing a pull request.

---

<p align="center">
  <strong>Built to make certificate generation faster, cleaner, and easier.</strong><br/>
  <a href="https://bulk-certificate-generator.space-z.ai/">🚀 Launch the App</a>
</p>