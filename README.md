# Clinic Queue Management Frontend

Role-based React frontend for the Clinic Queue Management System (CMS) API.

## Stack

- React + Vite
- Axios for API calls
- Local storage based auth session persistence

## API Base URL

The app is configured for:

`https://cmsback.sampaarsh.cloud`

## Student Login

- Use your assigned student email (for example: 23031701047@darshan.ac.in)
- Password: password123

## Features by Role

- Admin
	- View clinic information and team counts
	- List clinic users
	- Create receptionist, doctor, and patient users
- Patient
	- Book appointment
	- View own appointments with queue token/status
	- View appointment details including prescription/report
	- View own prescriptions and reports
- Receptionist
	- View queue by selected date
	- Update queue statuses (`waiting -> in-progress/skipped`, `in-progress -> done`)
- Doctor
	- View today's queue
	- Add prescription for appointment
	- Add report for appointment

## Local Setup

1. Install dependencies:

	 `npm install`

2. Start development server:

	 `npm run dev`

3. Build production bundle:

	 `npm run build`

4. Run lint checks:

	 `npm run lint`

## Notes

- Endpoints are secured with JWT (`Authorization: Bearer <token>`).
- Session is stored in local storage and restored on refresh.
- API responses are normalized in UI so minor response shape differences are handled safely.
