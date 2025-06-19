import mysql.connector
import time
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database Configuration - CHANGE THESE
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'root',  # Change to your password
    'database': 'vision_data'
}

class FaceDetectionMatcher:
    def __init__(self, db_config):
        self.db_config = db_config
        self.connection = None
        self.last_processed_detection_id = 0
        self.last_processed_face_id = 0
        
    def connect_db(self):
        """Connect to MySQL database"""
        try:
            self.connection = mysql.connector.connect(**self.db_config)
            logger.info("✅ Connected to MySQL database")
            return True
        except mysql.connector.Error as e:
            logger.error(f"❌ Database connection failed: {e}")
            return False
    
    def disconnect_db(self):
        """Disconnect from database"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            logger.info("🔌 Database connection closed")
    
    def get_last_processed_ids(self):
        """Get the last processed detection and face IDs to avoid reprocessing"""
        try:
            cursor = self.connection.cursor()
            
            # Get last processed detection ID
            cursor.execute("SELECT COALESCE(MAX(id), 0) FROM master_table")
            result = cursor.fetchone()
            if result:
                # Get the highest detection ID we've already processed
                cursor.execute("""
                    SELECT COALESCE(MAX(d.id), 0) 
                    FROM detections d 
                    INNER JOIN master_table mt ON d.tracking_id = mt.tracking_id 
                    AND d.frame_timestamp <= mt.matched_timestamp
                """)
                detection_result = cursor.fetchone()
                self.last_processed_detection_id = detection_result[0] if detection_result else 0
            
            cursor.close()
            logger.info(f"📊 Starting from detection ID: {self.last_processed_detection_id}")
            
        except mysql.connector.Error as e:
            logger.error(f"❌ Error getting last processed IDs: {e}")
    
    def find_matching_coordinates(self, time_window_seconds=30):
        """
        Find detections and faces with matching x,y coordinates within time window
        """
        try:
            cursor = self.connection.cursor(dictionary=True)
            
            # Query to find matching coordinates within time window
            query = """
            SELECT 
                d.id as detection_id,
                d.center_x as det_x,
                d.center_y as det_y,
                d.tracking_id as det_tracking_id,
                d.frame_timestamp as det_timestamp,
                f.id as face_id,
                f.center_x as face_x,
                f.center_y as face_y,
                f.tracking_id as face_tracking_id,
                f.frame_timestamp as face_timestamp,
                ABS(TIMESTAMPDIFF(SECOND, d.frame_timestamp, f.frame_timestamp)) as time_diff_seconds
            FROM detections d
            INNER JOIN faces f ON d.center_x = f.center_x 
                               AND d.center_y = f.center_y
                               AND ABS(TIMESTAMPDIFF(SECOND, d.frame_timestamp, f.frame_timestamp)) <= %s
            WHERE d.id > %s 
              AND d.is_active = 1 
              AND f.is_active = 1
              AND NOT EXISTS (
                  SELECT 1 FROM master_table mt 
                  WHERE mt.tracking_id = d.tracking_id 
                  AND mt.matched_timestamp = d.frame_timestamp
              )
            ORDER BY d.frame_timestamp ASC
            """
            
            cursor.execute(query, (time_window_seconds, self.last_processed_detection_id))
            matches = cursor.fetchall()
            cursor.close()
            
            return matches
            
        except mysql.connector.Error as e:
            logger.error(f"❌ Error finding matches: {e}")
            return []
    
    def find_fuzzy_matching_coordinates(self, tolerance_pixels=5, time_window_seconds=30):
        """
        Find detections and faces with approximately matching x,y coordinates (within tolerance)
        """
        try:
            cursor = self.connection.cursor(dictionary=True)
            
            # Query for fuzzy matching (within pixel tolerance)
            query = """
            SELECT 
                d.id as detection_id,
                d.center_x as det_x,
                d.center_y as det_y,
                d.tracking_id as det_tracking_id,
                d.frame_timestamp as det_timestamp,
                f.id as face_id,
                f.center_x as face_x,
                f.center_y as face_y,
                f.tracking_id as face_tracking_id,
                f.frame_timestamp as face_timestamp,
                ABS(TIMESTAMPDIFF(SECOND, d.frame_timestamp, f.frame_timestamp)) as time_diff_seconds,
                SQRT(POW(d.center_x - f.center_x, 2) + POW(d.center_y - f.center_y, 2)) as distance_pixels
            FROM detections d
            INNER JOIN faces f ON ABS(d.center_x - f.center_x) <= %s
                               AND ABS(d.center_y - f.center_y) <= %s
                               AND ABS(TIMESTAMPDIFF(SECOND, d.frame_timestamp, f.frame_timestamp)) <= %s
            WHERE d.id > %s 
              AND d.is_active = 1 
              AND f.is_active = 1
              AND NOT EXISTS (
                  SELECT 1 FROM master_table mt 
                  WHERE mt.tracking_id = d.tracking_id 
                  AND mt.matched_timestamp = d.frame_timestamp
              )
            HAVING distance_pixels <= %s
            ORDER BY d.frame_timestamp ASC, distance_pixels ASC
            """
            
            cursor.execute(query, (tolerance_pixels, tolerance_pixels, time_window_seconds, 
                                 self.last_processed_detection_id, tolerance_pixels))
            matches = cursor.fetchall()
            cursor.close()
            
            return matches
            
        except mysql.connector.Error as e:
            logger.error(f"❌ Error finding fuzzy matches: {e}")
            return []
    
    def store_match_in_master_table(self, detection_data, face_data):
        """
        Store matched detection and face in master_table
        """
        try:
            cursor = self.connection.cursor()
            
            # Generate global_id (you can modify this logic as needed)
            # For now, using a combination of detection_id and face_id
            global_id = int(f"{detection_data['detection_id']}{face_data['face_id']}")
            
            # Insert into master_table
            insert_query = """
            INSERT INTO master_table (tracking_id, global_id, matched_timestamp)
            VALUES (%s, %s, %s)
            """
            
            cursor.execute(insert_query, (
                detection_data['det_tracking_id'],
                global_id,
                detection_data['det_timestamp']
            ))
            
            match_id = cursor.lastrowid
            cursor.close()
            self.connection.commit()
            
            logger.info(f"✅ Match stored: ID={match_id}, Tracking={detection_data['det_tracking_id']}, "
                       f"Global={global_id}, Coords=({detection_data['det_x']},{detection_data['det_y']})")
            
            return match_id
            
        except mysql.connector.Error as e:
            logger.error(f"❌ Error storing match: {e}")
            return None
    
    def process_matches(self, use_fuzzy_matching=True, tolerance_pixels=5, time_window_seconds=30):
        """
        Process new matches and store them in master_table
        """
        try:
            # Find matches
            if use_fuzzy_matching:
                matches = self.find_fuzzy_matching_coordinates(tolerance_pixels, time_window_seconds)
                logger.info(f"🔍 Found {len(matches)} fuzzy matches (tolerance: {tolerance_pixels}px)")
            else:
                matches = self.find_matching_coordinates(time_window_seconds)
                logger.info(f"🔍 Found {len(matches)} exact matches")
            
            processed_count = 0
            
            for match in matches:
                # Store match in master_table
                match_id = self.store_match_in_master_table(match, match)
                if match_id:
                    processed_count += 1
                    # Update last processed detection ID
                    self.last_processed_detection_id = max(self.last_processed_detection_id, 
                                                         match['detection_id'])
            
            if processed_count > 0:
                logger.info(f"📊 Processed {processed_count} new matches")
            
            return processed_count
            
        except Exception as e:
            logger.error(f"❌ Error processing matches: {e}")
            return 0
    
    def get_statistics(self):
        """Get matching statistics"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            
            # Get total counts
            cursor.execute("SELECT COUNT(*) as total_detections FROM detections WHERE is_active = 1")
            total_detections = cursor.fetchone()['total_detections']
            
            cursor.execute("SELECT COUNT(*) as total_faces FROM faces WHERE is_active = 1")
            total_faces = cursor.fetchone()['total_faces']
            
            cursor.execute("SELECT COUNT(*) as total_matches FROM master_table")
            total_matches = cursor.fetchone()['total_matches']
            
            # Get recent matches
            cursor.execute("""
                SELECT tracking_id, global_id, matched_timestamp 
                FROM master_table 
                ORDER BY matched_timestamp DESC 
                LIMIT 5
            """)
            recent_matches = cursor.fetchall()
            
            cursor.close()
            
            return {
                'total_detections': total_detections,
                'total_faces': total_faces,
                'total_matches': total_matches,
                'match_rate': round((total_matches / max(total_detections, 1)) * 100, 2),
                'recent_matches': recent_matches
            }
            
        except mysql.connector.Error as e:
            logger.error(f"❌ Error getting statistics: {e}")
            return None
    
    def run_continuous_matching(self, check_interval=10, use_fuzzy=True, tolerance=5, time_window=30):
        """
        Run continuous matching process
        """
        logger.info(f"🚀 Starting continuous face-detection matching")
        logger.info(f"⚙️  Settings: Fuzzy={use_fuzzy}, Tolerance={tolerance}px, TimeWindow={time_window}s, Interval={check_interval}s")
        
        if not self.connect_db():
            return
        
        # Get last processed IDs
        self.get_last_processed_ids()
        
        try:
            iteration = 0
            while True:
                iteration += 1
                logger.info(f"🔄 Iteration {iteration} - Checking for new matches...")
                
                # Process matches
                new_matches = self.process_matches(use_fuzzy, tolerance, time_window)
                
                # Show statistics every 10 iterations
                if iteration % 10 == 0:
                    stats = self.get_statistics()
                    if stats:
                        logger.info(f"📊 Stats: {stats['total_detections']} detections, "
                                  f"{stats['total_faces']} faces, {stats['total_matches']} matches "
                                  f"({stats['match_rate']}% match rate)")
                
                logger.info(f"⏰ Waiting {check_interval} seconds...")
                time.sleep(check_interval)
                
        except KeyboardInterrupt:
            logger.info("🛑 Stopping matching process (Ctrl+C pressed)")
        except Exception as e:
            logger.error(f"❌ Unexpected error: {e}")
        finally:
            self.disconnect_db()
    
    def run_single_check(self, use_fuzzy=True, tolerance=5, time_window=30):
        """
        Run a single matching check
        """
        logger.info("🧪 Running single matching check...")
        
        if not self.connect_db():
            return
        
        self.get_last_processed_ids()
        new_matches = self.process_matches(use_fuzzy, tolerance, time_window)
        
        # Show statistics
        stats = self.get_statistics()
        if stats:
            logger.info(f"📊 Final Stats: {stats['total_detections']} detections, "
                      f"{stats['total_faces']} faces, {stats['total_matches']} matches")
            if stats['recent_matches']:
                logger.info("🎯 Recent matches:")
                for match in stats['recent_matches']:
                    logger.info(f"   Tracking={match['tracking_id']}, Global={match['global_id']}, "
                              f"Time={match['matched_timestamp']}")
        
        self.disconnect_db()
        return new_matches

def main():
    """Main function"""
    print("🎯 Face-Detection Matching Backend")
    print("=" * 40)
    
    # Create matcher instance
    matcher = FaceDetectionMatcher(DB_CONFIG)
    
    # Ask user what they want to do
    while True:
        print("\nOptions:")
        print("1. Run single matching check")
        print("2. Start continuous matching (exact coordinates)")
        print("3. Start continuous matching (fuzzy - with tolerance)")
        print("4. View current statistics")
        print("5. Exit")
        
        choice = input("\nEnter choice (1-5): ").strip()
        
        if choice == '1':
            use_fuzzy = input("Use fuzzy matching? (y/n, default y): ").strip().lower() != 'n'
            if use_fuzzy:
                tolerance = int(input("Pixel tolerance (default 5): ") or "5")
                matcher.run_single_check(use_fuzzy=True, tolerance=tolerance)
            else:
                matcher.run_single_check(use_fuzzy=False)
                
        elif choice == '2':
            interval = int(input("Check interval in seconds (default 10): ") or "10")
            time_window = int(input("Time window in seconds (default 30): ") or "30")
            matcher.run_continuous_matching(interval, use_fuzzy=False, time_window=time_window)
            break
            
        elif choice == '3':
            interval = int(input("Check interval in seconds (default 10): ") or "10")
            tolerance = int(input("Pixel tolerance (default 5): ") or "5")
            time_window = int(input("Time window in seconds (default 30): ") or "30")
            matcher.run_continuous_matching(interval, use_fuzzy=True, tolerance=tolerance, time_window=time_window)
            break
            
        elif choice == '4':
            if matcher.connect_db():
                stats = matcher.get_statistics()
                if stats:
                    print(f"\n📊 Current Statistics:")
                    print(f"   Total Detections: {stats['total_detections']}")
                    print(f"   Total Faces: {stats['total_faces']}")
                    print(f"   Total Matches: {stats['total_matches']}")
                    print(f"   Match Rate: {stats['match_rate']}%")
                    if stats['recent_matches']:
                        print(f"\n🎯 Recent Matches:")
                        for match in stats['recent_matches']:
                            print(f"   Tracking={match['tracking_id']}, Global={match['global_id']}, Time={match['matched_timestamp']}")
                matcher.disconnect_db()
                
        elif choice == '5':
            print("👋 Goodbye!")
            break
            
        else:
            print("❌ Invalid choice")

if __name__ == "__main__":
    main()