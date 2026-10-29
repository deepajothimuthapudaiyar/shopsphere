# ShopSphere (MERN) - run on Windows / VS Code
Prereqs: Node.js 18+, MongoDB Community running locally (or a MongoDB Atlas URI in backend/.env).

## Backend (terminal 1)
cd shopsphere\backend
copy .env.example .env
npm install
npm run seed      (creates categories, 16 products and the first admin)
npm run dev       (API on http://localhost:5000)

## Frontend (terminal 2)
cd shopsphere\frontend
npm install
npm run dev       (open http://localhost:5173)

## First admin account
Created by `npm run seed` from ADMIN_EMAIL / ADMIN_PASSWORD in backend/.env
(default admin@shopsphere.com / Admin@123). Log in, then open "Admin" in the navbar.
Anyone who registers normally is a customer (role "user").
