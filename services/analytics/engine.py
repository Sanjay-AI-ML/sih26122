import os
import sqlite3
import pandas as pd
import duckdb

# Path to the writeback service's sqlite DB
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "writeback", "setu.db"))

class AnalyticsEngine:
    def __init__(self):
        self.con = duckdb.connect(database=':memory:')

    def _sync_data(self):
        """
        Reads the latest data from SQLite via Pandas and registers it to DuckDB.
        This avoids needing the sqlite_scanner network extension download.
        """
        if not os.path.exists(DB_PATH):
            return
            
        with sqlite3.connect(DB_PATH) as conn:
            df = pd.read_sql_query("SELECT * FROM audit_log", conn)
            # Register the pandas dataframe as a virtual table in DuckDB
            self.con.register('audit_log', df)

    def get_progress_s_curve(self):
        self._sync_data()
        try:
            # Aggregate quantities by date and discipline
            query = """
                SELECT event_date, discipline, SUM(quantity) as daily_quantity 
                FROM audit_log 
                WHERE status = 'approved' AND quantity IS NOT NULL
                GROUP BY event_date, discipline 
                ORDER BY event_date ASC
            """
            result_df = self.con.execute(query).fetchdf()
            
            # Convert to list of dicts
            return result_df.to_dict(orient="records")
        except duckdb.CatalogException:
            # Table doesn't exist yet
            return []

    def get_ambiguity_stats(self):
        self._sync_data()
        try:
            query = """
                SELECT 
                    COUNT(*) as total_events,
                    SUM(CASE WHEN was_ambiguous = TRUE THEN 1 ELSE 0 END) as ambiguous_events,
                    SUM(CASE WHEN confidence_band = 'high' THEN 1 ELSE 0 END) as auto_suggested
                FROM audit_log
            """
            result_df = self.con.execute(query).fetchdf()
            return result_df.to_dict(orient="records")[0] if not result_df.empty else {}
        except duckdb.CatalogException:
            return {}

analytics_engine = AnalyticsEngine()
