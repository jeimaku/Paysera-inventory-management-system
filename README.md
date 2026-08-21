# 📦 Paysera Inventory Management System

> A full-stack internal asset management platform developed to track company hardware devices, employee assignments, maintenance activities, and operational workflows.

The **Paysera Inventory Management System** was developed to improve the management of company-owned hardware assets deployed to employees.

The platform provides a centralized solution for monitoring device records, deployment history, return schedules, warranty information, repair activities, and user access permissions.

---

# 🎥 System Walkthrough

A demonstration of the complete system workflow:

- User authentication
- Dashboard overview
- Device inventory management
- Employee assignment tracking
- Device deployment monitoring
- Repair history management
- Warranty monitoring
- User and role management


![System Walkthrough](docs/system-walkthrough.gif)

---

# 🚀 Key Features

## 🔐 Authentication & Access Control

- Implemented secure user authentication using Supabase Authentication.
- Developed role-based access control to manage user permissions.
- Protected system modules based on assigned user roles.


---

## 💻 Device Inventory Management

- Developed CRUD operations for hardware asset records.
- Added device registration, editing, deletion, and search functionality.
- Maintained structured information including:
  - Device type
  - Serial number
  - Asset information
  - Deployment status
  - Warranty details


---

## 👥 Employee Device Assignment

- Connected hardware assets with assigned employees.
- Tracked device deployment history.
- Improved visibility of currently assigned and available devices.


---

## 🛠️ Maintenance & Repair Tracking

- Created maintenance tracking workflows for hardware issues.
- Recorded repair history and device condition updates.
- Supported easier monitoring of device lifecycle activities.


---

## 📅 Warranty & Return Monitoring

- Stored warranty information for hardware assets.
- Monitored device return schedules.
- Helped identify devices requiring maintenance, replacement, or follow-up.


---

## 📊 Administrative Management

- Provided administrative tools for managing:
  - Devices
  - Employees
  - Maintenance records
  - User accounts

- Improved organization of internal hardware records compared to manual tracking.


---

# 🏗️ System Architecture


```
React.js Frontend

        |
        |

Service Layer
(Device Service,
Employee Service,
Maintenance Service,
Repair Service,
User Service)

        |
        |

Supabase Backend

(PostgreSQL Database
+
Authentication)

```


The application follows a modular frontend structure where business logic is separated into reusable service modules.

This approach improves:

- Maintainability
- Code organization
- Scalability
- Feature development


---

# 🛠️ Technology Stack


## Frontend

- React.js
- JavaScript
- Vite
- CSS


## Backend & Database

- Supabase
- PostgreSQL
- Supabase Authentication


## Development Tools

- Git & GitHub
- REST API Integration
- On-premises Deployment


---

# 📂 Project Structure


```
src

├── auth
│
├── components
│
├── pages
│
│   └── Admin
│
├── services
│
│   ├── deviceService.js
│   ├── employeeService.js
│   ├── maintenanceService.js
│   ├── repairService.js
│   └── userService.js
│
├── supabase
│   └── client.js
│
└── utils

```


---

# 💡 Development Highlights


## Modular Service Architecture

Implemented dedicated service modules to handle application logic:

- Device management
- Employee management
- Maintenance workflows
- Repair tracking
- User management


This structure separates frontend components from database operations, making the application easier to maintain and extend.


---

## Database Integration

Designed database-driven workflows using Supabase PostgreSQL.

Implemented data handling for:

- Hardware inventory records
- Employee assignments
- Maintenance history
- User authentication
- Role-based permissions


---

## Business Workflow Digitization

Converted manual hardware tracking processes into a centralized internal platform.

The system improved:

- Asset visibility
- Record accuracy
- Device lifecycle monitoring
- Operational efficiency


---

# 🎯 Project Purpose

This project demonstrates practical full-stack development applied to a real business environment.

The system combines:

- Frontend application development
- Database-driven architecture
- Authentication systems
- Internal workflow automation
- Business process improvement


---

# 👨‍💻 Developer


**Jay Mark Apelado**

Bachelor of Science in Information Technology

Areas of interest:

- Full Stack Development
- Business Application Development
- IT Support Engineering
- System Automation
- Enterprise Workflow Solutions


---

⭐ Developed as part of an internship-based software development project.
