import sqlite3

DATABASE_NAME = "leads.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_NAME)
    connection.row_factory = sqlite3.Row
    return connection


def init_database():
    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_message TEXT NOT NULL,
            lead_status TEXT,
            priority TEXT,
            service TEXT,
            business_type TEXT,
            budget TEXT,
            timeline TEXT,
            missing_information TEXT,
            summary TEXT,
            suggested_response TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    connection.commit()
    connection.close()