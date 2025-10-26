# ![Bié Okutuala](https://img.shields.io/badge/Bi%C3%A9%20Okutuala-1.0.0-blue?style=for-the-badge&logo=appveyor) Bazar Bié Okutuala

## About

**Bazar Bié Okutuala** is a modern buying and selling platform developed to connect sellers and customers in the Bié region of Angola.

Our goal is to **simplify local commerce**, offering an intuitive, secure, and reliable experience. With a responsive design optimized for mobile devices, it is ideal for those who want to **buy or sell products** quickly and conveniently.

---

## Table of Contents

- [Features](#features)
- [Technologies and Languages](#technologies-and-languages)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Project Architecture](#project-architecture)
  - [Frontend](#frontend)
  - [Backend](#backend)
- [Support](#support)
- [Usage Suggestions](#usage-suggestions)

---

## Features

### 🎯 For Customers
- **Easy search and navigation**: Filter by categories and find products quickly.
- **Complete product details**: View images, descriptions, prices, and reviews.
- **Shopping cart**: Add products, change quantities, and finalize orders.
- **Reviews and comments**: Rate products and share experiences.
- **Secure payments**: Card or bank transfer, with payment confirmation.
- **Real-time notifications**: Updates on order status and promotions.

### 🛍 For Sellers
- **Quick product registration**: Publish products with detailed images and descriptions.
- **Store management**: Track orders, payments, and store information.
- **Document submission**: Secure upload of necessary documents for verification.
- **Statistics and history**: Control your sales and performance over time.

### 👑 For Administrators
- **User and store management**: Control accounts, permissions, and store status.
- **Payment approval**: Validate receipts and update order status.
- **Detailed reports**: Access to payments, orders, and a complete history of activities.

---

## Technologies and Languages
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white) ![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-00758F?style=for-the-badge&logo=postgresql&logoColor=white) ![Cloudinary](https://img.shields.io/badge/Cloudinary-282C34?style=for-the-badge&logo=cloudinary&logoColor=white)

- **Frontend:** HTML, CSS, JavaScript (responsive and modern)
- **Backend:** Node.js, Express
- **Database:** PostgreSQL and Supabase
- **File Storage:** Cloudinary (images and documents)
- **Notification Sending:** Email via SMTP

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/bie-okutuala.git
   cd bie-okutuala
   ```

2. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies:**
   The frontend has no build dependencies, but you'll need a simple web server to run it.

### Running the Application

1. **Start the database:**
   From the root of the project, run:
   ```bash
   docker-compose up -d
   ```

2. **Set up environment variables:**
   - In the `server` directory, create a `.env` file and add the necessary environment variables (see `.env.example`).
   - In `frontend/public/assets/js`, create a `config.js` file from `config.example.js` and set the `API_URL`.

3. **Run the backend server:**
   ```bash
   cd server
   npm start
   ```

4. **Run the frontend:**
   You can use a simple HTTP server like `live-server`.
   ```bash
   cd frontend/public
   npx live-server
   ```

---

## Project Architecture

### Frontend

The frontend is located in the `frontend/public` directory and consists of static HTML, CSS, and JavaScript files. It is a multi-page application that communicates with the backend via a REST API.

### Backend

The backend is a Node.js application using the Express framework. It is located in the `server` directory and follows a standard MVC-like architecture:

- `src/routes`: Defines the API endpoints.
- `src/controllers`: Handles the business logic for each route.
- `src/services`: Contains reusable business logic that can be shared across controllers.
- `src/repositories`: Interacts with the database.
- `src/middleware`: Contains middleware functions for authentication, validation, etc.
- `src/config`: Contains configuration files for the database, cloud services, etc.

---

## Support

If you have questions, problems, or suggestions, please contact us:

- **Support Email:** suporte@bieokutuala.com
- **Phone/WhatsApp:** +244 936370703
- **Social Media:** [Facebook](#), [Instagram](#), [Twitter](#)

---

## Usage Suggestions
- Use an **updated browser** or the **official mobile app** for the best experience.
- Log in before buying or selling products for security and traceability.
- Rate products and sellers to keep the community reliable.
- Keep your data and documents updated to receive payments without problems.

---

**Bazar Bié Okutuala** — Connecting people, simplifying commerce, and valuing the Bié community.
