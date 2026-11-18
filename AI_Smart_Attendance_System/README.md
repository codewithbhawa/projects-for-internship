# AttendAI — AI-Based Smart Attendance System

A student-level Flask + SQLite web project with an admin dashboard, student directory, attendance register, attendance analytics, a transparent performance-estimate module, and a privacy-conscious face-attendance concept demo.

## Features
- Admin login and dashboard
- Add and view student records
- Mark Present/Absent attendance by date; one record per student per day
- Student-wise attendance percentage analytics
- Performance estimate using a clearly explained weighted formula
- Browser camera preview with admin-confirmed attendance (no face images are uploaded or stored)
- Demo student data included on first run

## Requirements
- Python 3.9 or newer
- Windows / macOS / Linux
- A modern browser

## Run on Windows (PowerShell)
1. Extract the ZIP file.
2. Open the extracted folder in VS Code.
3. Open Terminal and run:

```powershell
py -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

4. Open `http://127.0.0.1:5000` in your browser.

If PowerShell blocks activation, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that terminal, then activate again.

## Demo admin login
- Username: `admin`
- Password: `admin123`

Change the demo credentials and `SECRET_KEY` before any real deployment. This is a classroom prototype, not a production attendance platform.

## Demo performance estimate
The current score is:
`0.40 × attendance percentage + 0.60 × latest marks`

It is an explainable educational demonstration, not a validated machine-learning model or a reliable prediction of future performance. Do not use it to penalize or make high-impact decisions about students. A stronger model would require a sufficiently large, representative, consented dataset and proper evaluation.

## Face feature: important limitation
The Face demo provides a live camera preview and an admin-confirmation workflow. It does **not** perform automated face recognition. Automated biometric matching requires careful consent, secure storage, access controls, a non-biometric alternative, and compliance with applicable privacy rules. This project intentionally avoids collecting or storing face templates/images.

## Database
SQLite database `attendance.db` is created automatically in the project folder. Delete it only if you want to reset all demo data.
