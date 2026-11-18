# FinPilot – AI Finance & Expense Manager

A student-friendly personal finance web application built with Python Flask, SQLite, HTML, CSS, JavaScript and Chart.js.

## Features
1. Dashboard – income, expenses, balance and recent transactions.
2. Transaction management – add and delete income/expense records with category, date and notes.
3. Transaction analysis – category-wise expense chart and monthly income-vs-expense chart.
4. Expense forecasting – estimates the next month's expenses using the average of up to the last three recorded months.
5. Bill / receipt generation – creates a receipt preview and lets the user print or save it as a PDF.
6. SQLite database – stores transaction records locally in `finance.db`.
7. Responsive interface – works on desktop and mobile-sized screens.

## Requirements
- Python 3.10 or newer
- Internet connection for Chart.js CDN and Google Fonts (the app itself runs locally)

## Run on Windows (PowerShell)
1. Extract the ZIP folder.
2. Open PowerShell in the extracted `AI_Finance_Expense_Manager` folder.
3. Create a virtual environment:
   ```powershell
   python -m venv venv
   ```
4. Activate it:
   ```powershell
   .\\venv\\Scripts\\Activate.ps1
   ```
5. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
6. Start the app:
   ```powershell
   python app.py
   ```
7. Open this address in your browser:
   `http://127.0.0.1:5000`

## Demo data
The database is created automatically on the first run and includes sample transactions. You can delete the sample records from the Transactions page and enter your own.

## Project structure
```text
AI_Finance_Expense_Manager/
├── app.py
├── requirements.txt
├── README.md
├── templates/
│   ├── base.html
│   ├── index.html
│   ├── transactions.html
│   ├── analysis.html
│   ├── forecast.html
│   ├── receipt.html
│   ├── receipt_print.html
│   └── about.html
└── static/
    └── style.css
```

## Important academic note
The project is named AI Finance & Expense Manager as a project theme. Its current forecast is a transparent statistical baseline (recent-month average), not a trained AI/ML model. A genuine ML extension could use a time-series regression model after collecting sufficient monthly data. The app is a local educational demo, not a bank-connected financial product.
