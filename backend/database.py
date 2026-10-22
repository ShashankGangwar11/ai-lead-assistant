import os
import sqlite3

from dotenv import load_dotenv

load_dotenv()

DATABASE_NAME = "leads.db"
DATABASE_URL = os.getenv("DATABASE_URL")


def is_postgres():
    return bool(DATABASE_URL)


def get_connection():
    if is_postgres():
        import psycopg
        from psycopg.rows import dict_row

        return psycopg.connect(
            DATABASE_URL,
            row_factory=dict_row
        )

    connection = sqlite3.connect(DATABASE_NAME)
    connection.row_factory = sqlite3.Row
    return connection


def init_database():
    connection = get_connection()

    if is_postgres():
        connection.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                id BIGSERIAL PRIMARY KEY,
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
    else:
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