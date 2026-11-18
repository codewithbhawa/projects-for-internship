from flask import Flask, render_template, request, redirect, url_for, flash, make_response
import sqlite3, os
from datetime import date, datetime, timedelta
from collections import defaultdict
from statistics import mean

app = Flask(__name__)
app.secret_key = "student-demo-secret-key"
DB_PATH = os.path.join(os.path.dirname(__file__), "finance.db")

def db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con

def init_db():
    con = db()
    con.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            kind TEXT NOT NULL CHECK(kind IN ('Income','Expense')),
            txn_date TEXT NOT NULL,
            note TEXT DEFAULT ''
        )
    """)
    count = con.execute("SELECT COUNT(*) FROM transactions").fetchone()[0]
    if count == 0:
        today = date.today()
        samples = [
            ("Monthly Pocket Money","Allowance",12000,"Income",today.replace(day=2).isoformat(),"Monthly income"),
            ("Freelance Design","Freelance",3500,"Income",(today-timedelta(days=8)).isoformat(),"Small project"),
            ("Groceries","Food",1800,"Expense",(today-timedelta(days=1)).isoformat(),"Home groceries"),
            ("Metro Recharge","Transport",500,"Expense",(today-timedelta(days=3)).isoformat(),"Travel"),
            ("College Books","Education",1250,"Expense",(today-timedelta(days=5)).isoformat(),"Study material"),
            ("Coffee with friends","Food",420,"Expense",(today-timedelta(days=7)).isoformat(),"Cafe"),
            ("Internet Bill","Bills",799,"Expense",(today-timedelta(days=10)).isoformat(),"Monthly bill"),
            ("Movie Ticket","Entertainment",350,"Expense",(today-timedelta(days=12)).isoformat(),"Weekend"),
            ("Medicine","Health",280,"Expense",(today-timedelta(days=15)).isoformat(),"Pharmacy"),
            ("Clothing","Shopping",1100,"Expense",(today-timedelta(days=18)).isoformat(),"Personal"),
            ("Tutoring","Freelance",1800,"Income",(today-timedelta(days=20)).isoformat(),"Tuition"),
        ]
        con.executemany("INSERT INTO transactions(title,category,amount,kind,txn_date,note) VALUES(?,?,?,?,?,?)", samples)
    con.commit()
    con.close()

@app.route("/")
def dashboard():
    con = db()
    rows = con.execute("SELECT * FROM transactions ORDER BY txn_date DESC, id DESC").fetchall()
    income = sum(r["amount"] for r in rows if r["kind"] == "Income")
    expenses = sum(r["amount"] for r in rows if r["kind"] == "Expense")
    balance = income - expenses
    category_totals = defaultdict(float)
    for r in rows:
        if r["kind"] == "Expense":
            category_totals[r["category"]] += r["amount"]
    month_start = date.today().replace(day=1).isoformat()
    month_expense = con.execute("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE kind='Expense' AND txn_date>=?", (month_start,)).fetchone()[0]
    recent = rows[:7]
    con.close()
    return render_template("index.html", income=income, expenses=expenses, balance=balance,
                           category_labels=list(category_totals.keys()), category_values=list(category_totals.values()),
                           recent=recent, month_expense=month_expense, total=len(rows))

@app.route("/transactions", methods=["GET","POST"])
def transactions():
    con = db()
    if request.method == "POST":
        title = request.form.get("title","").strip()
        category = request.form.get("category","Other").strip()
        kind = request.form.get("kind","Expense")
        try:
            amount = float(request.form.get("amount",0))
            txn_date = request.form.get("txn_date") or date.today().isoformat()
            note = request.form.get("note","").strip()
            if not title or amount <= 0 or kind not in ("Income","Expense"):
                raise ValueError()
            con.execute("INSERT INTO transactions(title,category,amount,kind,txn_date,note) VALUES(?,?,?,?,?,?)",
                        (title,category,amount,kind,txn_date,note))
            con.commit()
            flash("Transaction added successfully.","success")
        except ValueError:
            flash("Please enter a valid title and an amount greater than zero.","error")
        con.close()
        return redirect(url_for("transactions"))
    rows = con.execute("SELECT * FROM transactions ORDER BY txn_date DESC, id DESC").fetchall()
    con.close()
    return render_template("transactions.html", rows=rows)

@app.route("/delete/<int:txn_id>", methods=["POST"])
def delete_transaction(txn_id):
    con = db()
    con.execute("DELETE FROM transactions WHERE id=?", (txn_id,))
    con.commit()
    con.close()
    flash("Transaction deleted.","success")
    return redirect(url_for("transactions"))

@app.route("/analysis")
def analysis():
    con = db()
    rows = con.execute("SELECT category, kind, SUM(amount) AS total FROM transactions GROUP BY category, kind").fetchall()
    monthly = con.execute("""
        SELECT substr(txn_date,1,7) AS month, kind, SUM(amount) AS total
        FROM transactions GROUP BY month, kind ORDER BY month
    """).fetchall()
    con.close()
    expense_categories = [r for r in rows if r["kind"] == "Expense"]
    return render_template("analysis.html",
        cat_labels=[r["category"] for r in expense_categories],
        cat_values=[r["total"] for r in expense_categories],
        months=sorted(set(r["month"] for r in monthly)),
        monthly_income={r["month"]:r["total"] for r in monthly if r["kind"]=="Income"},
        monthly_expense={r["month"]:r["total"] for r in monthly if r["kind"]=="Expense"})

@app.route("/forecast")
def forecast():
    con = db()
    rows = con.execute("""
        SELECT substr(txn_date,1,7) AS month, SUM(amount) AS total
        FROM transactions WHERE kind='Expense'
        GROUP BY month ORDER BY month
    """).fetchall()
    con.close()
    history = [{"month":r["month"],"amount":float(r["total"])} for r in rows]
    values = [x["amount"] for x in history]
    # Simple baseline forecast: average of up to the last 3 recorded months.
    forecast_value = round(mean(values[-3:]), 2) if values else 0
    return render_template("forecast.html", history=history, forecast_value=forecast_value)

@app.route("/receipt", methods=["GET","POST"])
def receipt():
    receipt_data = None
    if request.method == "POST":
        try:
            receipt_data = {
                "number": "AIF-" + datetime.now().strftime("%Y%m%d%H%M%S"),
                "date": request.form.get("receipt_date") or date.today().isoformat(),
                "payer": request.form.get("payer","").strip(),
                "description": request.form.get("description","").strip(),
                "category": request.form.get("category","Other"),
                "amount": float(request.form.get("amount",0)),
                "payment": request.form.get("payment","Cash"),
                "note": request.form.get("note","").strip()
            }
            if not receipt_data["payer"] or not receipt_data["description"] or receipt_data["amount"] <= 0:
                raise ValueError()
        except ValueError:
            receipt_data = None
            flash("Enter a payer name, description and valid amount.","error")
    return render_template("receipt.html", receipt=receipt_data)

@app.route("/receipt/print", methods=["POST"])
def print_receipt():
    fields = {k: request.form.get(k,"") for k in ["number","date","payer","description","category","amount","payment","note"]}
    return render_template("receipt_print.html", r=fields)

@app.route("/about")
def about():
    return render_template("about.html")

if __name__ == "__main__":
    init_db()
    app.run(debug=True)
