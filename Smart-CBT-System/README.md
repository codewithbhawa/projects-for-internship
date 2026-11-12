# Smart CBT

Smart CBT is a React/Vite frontend with a Flask API and SQLite database.

## Requirements

- Python 3.10 or later
- Node.js 20.19 or later

## Start the backend

From the project directory:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python create_admin.py
python seed_demo.py
python app.py
```

Create an admin account when prompted. `seed_demo.py` adds a ready-to-take 10-question sample exam and can be run again safely. Admins can edit questions and view students' marks. Student exams use a countdown timer and submit automatically when time expires; the result page shows actual marks and an estimate based on recent exam percentages. The API runs at `http://localhost:5000`.

## Start the frontend

Open a second terminal in the project directory:

```powershell
npm install --prefix frontend
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). Students can create an account from the login page; admins sign in with the account created above.

## Checks and production build

Run these commands from the project directory:

```powershell
npm run lint
npm run build
```
