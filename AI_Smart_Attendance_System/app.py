from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import sqlite3, os, base64, datetime
from functools import wraps

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "change-this-demo-secret")
DB = "attendance.db"

def db():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    return con

def init_db():
    con = db()
    con.executescript("""
    CREATE TABLE IF NOT EXISTS students(
      id INTEGER PRIMARY KEY AUTOINCREMENT, roll TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL, class_name TEXT NOT NULL, email TEXT DEFAULT '',
      marks REAL DEFAULT 0, face_file TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS attendance(
      id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL,
      date TEXT NOT NULL, status TEXT NOT NULL, method TEXT DEFAULT 'Manual',
      UNIQUE(student_id,date), FOREIGN KEY(student_id) REFERENCES students(id)
    );
    """)
    count = con.execute("SELECT COUNT(*) FROM students").fetchone()[0]
    if count == 0:
        demo = [
          ("ST001","Aarav Sharma","BCA-1","aarav@example.com",82),
          ("ST002","Diya Verma","BCA-1","diya@example.com",91),
          ("ST003","Kabir Singh","BCA-1","kabir@example.com",58),
          ("ST004","Meera Gupta","BCA-1","meera@example.com",74),
          ("ST005","Ishaan Khan","BCA-1","ishaan@example.com",46)
        ]
        con.executemany("INSERT INTO students(roll,name,class_name,email,marks) VALUES(?,?,?,?,?)", demo)
    con.commit(); con.close()

def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get("admin"): return redirect(url_for("login"))
        return fn(*args, **kwargs)
    return wrapper

@app.route("/", methods=["GET"])
def home():
    if not session.get("admin"): return redirect(url_for("login"))
    return redirect(url_for("dashboard"))

@app.route("/login", methods=["GET","POST"])
def login():
    if request.method == "POST":
        if request.form.get("username") == "admin" and request.form.get("password") == "admin123":
            session["admin"] = True
            return redirect(url_for("dashboard"))
        flash("Incorrect username or password.")
    return render_template("login.html")

@app.route("/logout")
def logout():
    session.clear(); return redirect(url_for("login"))

@app.route("/dashboard")
@login_required
def dashboard():
    con = db()
    students = con.execute("SELECT COUNT(*) FROM students").fetchone()[0]
    today = datetime.date.today().isoformat()
    present = con.execute("SELECT COUNT(*) FROM attendance WHERE date=? AND status='Present'",(today,)).fetchone()[0]
    absent = con.execute("SELECT COUNT(*) FROM attendance WHERE date=? AND status='Absent'",(today,)).fetchone()[0]
    recent = con.execute("""SELECT s.name,s.roll,a.date,a.status,a.method FROM attendance a
      JOIN students s ON s.id=a.student_id ORDER BY a.date DESC,a.id DESC LIMIT 7""").fetchall()
    con.close()
    return render_template("dashboard.html", students=students,present=present,absent=absent,recent=recent)

@app.route("/students", methods=["GET","POST"])
@login_required
def students_page():
    con=db()
    if request.method=="POST":
        try:
            con.execute("INSERT INTO students(roll,name,class_name,email,marks) VALUES(?,?,?,?,?)",
              (request.form["roll"].strip(),request.form["name"].strip(),request.form["class_name"].strip(),
               request.form.get("email",""),float(request.form.get("marks") or 0)))
            con.commit(); flash("Student added successfully.")
        except sqlite3.IntegrityError: flash("That roll number already exists.")
        return redirect(url_for("students_page"))
    rows=con.execute("SELECT * FROM students ORDER BY roll").fetchall(); con.close()
    return render_template("students.html", students=rows)

@app.route("/attendance", methods=["GET","POST"])
@login_required
def attendance_page():
    con=db()
    if request.method=="POST":
        sid=int(request.form["student_id"]); date=request.form.get("date") or datetime.date.today().isoformat()
        status=request.form["status"]
        con.execute("""INSERT INTO attendance(student_id,date,status,method) VALUES(?,?,?,'Manual')
          ON CONFLICT(student_id,date) DO UPDATE SET status=excluded.status,method='Manual'""",(sid,date,status))
        con.commit(); flash("Attendance saved.")
        return redirect(url_for("attendance_page"))
    students=con.execute("SELECT * FROM students ORDER BY name").fetchall()
    records=con.execute("""SELECT s.name,s.roll,a.date,a.status,a.method FROM attendance a
      JOIN students s ON s.id=a.student_id ORDER BY a.date DESC,a.id DESC LIMIT 40""").fetchall()
    con.close()
    return render_template("attendance.html",students=students,records=records,today=datetime.date.today().isoformat())

@app.route("/analytics")
@login_required
def analytics():
    con=db()
    rows=con.execute("""SELECT s.id,s.name,s.roll,
      SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END) present,
      COUNT(a.id) total FROM students s LEFT JOIN attendance a ON s.id=a.student_id GROUP BY s.id""").fetchall()
    con.close()
    data=[]
    for r in rows:
        pct=round((r["present"] or 0)*100/r["total"],1) if r["total"] else 0
        data.append({"name":r["name"],"roll":r["roll"],"present":r["present"] or 0,"total":r["total"],"pct":pct})
    return render_template("analytics.html", data=data)

@app.route("/prediction")
@login_required
def prediction():
    con=db()
    rows=con.execute("""SELECT s.name,s.roll,s.marks,
      SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END) present,COUNT(a.id) total
      FROM students s LEFT JOIN attendance a ON s.id=a.student_id GROUP BY s.id""").fetchall()
    con.close(); results=[]
    for r in rows:
        attendance=(r["present"] or 0)*100/(r["total"] or 1) if r["total"] else 0
        # Explainable demo score: attendance contributes 40%, recorded marks 60%.
        score=round(0.4*attendance+0.6*float(r["marks"] or 0),1)
        label="On track" if score>=75 else ("Needs support" if score>=55 else "At risk")
        results.append({"name":r["name"],"roll":r["roll"],"attendance":round(attendance,1),
                        "marks":r["marks"],"score":score,"label":label})
    return render_template("prediction.html",results=results)

@app.route("/face")
@login_required
def face_page():
    con=db(); students=con.execute("SELECT id,roll,name FROM students ORDER BY name").fetchall(); con.close()
    return render_template("face.html",students=students)

@app.route("/api/face-attendance",methods=["POST"])
@login_required
def face_attendance():
    payload=request.get_json(silent=True) or {}
    sid=payload.get("student_id")
    if not sid: return jsonify(ok=False,message="Select a student first.")
    con=db()
    exists=con.execute("SELECT id FROM students WHERE id=?",(sid,)).fetchone()
    if not exists: con.close(); return jsonify(ok=False,message="Student not found.")
    today=datetime.date.today().isoformat()
    con.execute("""INSERT INTO attendance(student_id,date,status,method) VALUES(?,?,'Present','Face demo')
      ON CONFLICT(student_id,date) DO UPDATE SET status='Present',method='Face demo'""",(sid,today))
    con.commit(); con.close()
    return jsonify(ok=True,message="Demo attendance saved. This prototype uses a camera preview + admin confirmation, not automated identity matching.")

@app.route("/api/attendance-data")
@login_required
def attendance_data():
    con=db()
    rows=con.execute("""SELECT date,
      SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) present,
      SUM(CASE WHEN status='Absent' THEN 1 ELSE 0 END) absent
      FROM attendance GROUP BY date ORDER BY date DESC LIMIT 7""").fetchall()
    con.close()
    return jsonify([dict(r) for r in rows][::-1])

if __name__=="__main__":
    init_db()
    app.run(debug=True)
