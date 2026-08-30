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
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                    SUM(CASE WHEN was_ambiguous = TRUE THEN 1 ELSE 0 END) as ambiguous
                FROM audit_log
            """
            result_df = self.con.execute(query).fetchdf()
            return result_df.to_dict(orient="records")[0] if not result_df.empty else {}
        except duckdb.CatalogException:
            return {}

    def get_discipline_breakdown(self):
        """Returns approved event count grouped by discipline."""
        self._sync_data()
        try:
            query = """
                SELECT discipline, COUNT(*) as count
                FROM audit_log
                WHERE status = 'approved'
                GROUP BY discipline
                ORDER BY count DESC
            """
            result_df = self.con.execute(query).fetchdf()
            return result_df.to_dict(orient="records")
        except duckdb.CatalogException:
            return []

    def get_daily_trend(self):
        """Returns approved event count grouped by event_date for trend charts."""
        self._sync_data()
        try:
            query = """
                SELECT event_date, COUNT(*) as count
                FROM audit_log
                WHERE status = 'approved'
                GROUP BY event_date
                ORDER BY event_date ASC
            """
            result_df = self.con.execute(query).fetchdf()
            return result_df.to_dict(orient="records")
        except duckdb.CatalogException:
            return []

    def get_delay_analysis(self):
        """Returns delay analysis by discipline and activity."""
        self._sync_data()
        try:
            query = """
                SELECT
                    discipline,
                    COUNT(*) as total_activities,
                    AVG(CAST(delay_reason IS NOT NULL AS INT) * 1.0) * 100 as avg_delay_pct,
                    MAX(CASE WHEN delay_reason IS NOT NULL THEN 1 ELSE 0 END) as has_delays
                FROM audit_log
                WHERE status = 'approved'
                GROUP BY discipline
                ORDER BY avg_delay_pct DESC
            """
            result_df = self.con.execute(query).fetchdf()
            return result_df.to_dict(orient="records")
        except duckdb.CatalogException:
            return []

    def get_confidence_metrics(self):
        """Returns average confidence score and distribution."""
        self._sync_data()
        try:
            query = """
                SELECT
                    AVG(confidence_score) as avg_confidence,
                    MIN(confidence_score) as min_confidence,
                    MAX(confidence_score) as max_confidence,
                    COUNT(CASE WHEN confidence_score >= 80 THEN 1 END) as high_confidence_count,
                    COUNT(CASE WHEN confidence_score >= 60 AND confidence_score < 80 THEN 1 END) as medium_confidence_count,
                    COUNT(CASE WHEN confidence_score < 60 THEN 1 END) as low_confidence_count
                FROM audit_log
                WHERE status = 'approved'
            """
            result_df = self.con.execute(query).fetchdf()
            return result_df.to_dict(orient="records")[0] if not result_df.empty else {}
        except duckdb.CatalogException:
            return {}

analytics_engine = AnalyticsEngine()
