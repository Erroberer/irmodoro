// IndexedDB Database Manager for İRMODORO
class IrmodoroDatabase {
  constructor() {
    this.dbName = 'IrmodoroStats';
    this.version = 1;
    this.db = null;
  }

  // Initialize database
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Database failed to open'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        this.db = event.target.result;

        // Create sessions store
        if (!this.db.objectStoreNames.contains('sessions')) {
          const sessionsStore = this.db.createObjectStore('sessions', {
            keyPath: 'id',
            autoIncrement: true
          });

          // Create indexes
          sessionsStore.createIndex('date', 'date', { unique: false });
          sessionsStore.createIndex('startTime', 'startTime', { unique: false });
          sessionsStore.createIndex('type', 'type', { unique: false });
        }

        // Create daily stats store
        if (!this.db.objectStoreNames.contains('dailyStats')) {
          const dailyStatsStore = this.db.createObjectStore('dailyStats', {
            keyPath: 'date'
          });
        }
      };
    });
  }

  // Add a new session
  async addSession(sessionData) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');

      const session = {
        date: new Date().toDateString(),
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        duration: sessionData.duration, // in seconds
        type: sessionData.type, // 'work' or 'rest'
        tasksCompleted: sessionData.tasksCompleted || 0,
        timestamp: Date.now()
      };

      const request = store.add(session);

      request.onsuccess = () => {
        this.updateDailyStats(session.date);
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('Failed to add session'));
      };
    });
  }

  // Get sessions for a specific date range
  async getSessionsByDateRange(startDate, endDate) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sessions'], 'readonly');
      const store = transaction.objectStore('sessions');
      const index = store.index('date');

      const sessions = [];
      const range = IDBKeyRange.bound(startDate, endDate);

      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          sessions.push(cursor.value);
          cursor.continue();
        } else {
          resolve(sessions);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to get sessions'));
      };
    });
  }

  // Get last 7 days sessions
  async getLastWeekSessions() {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return this.getSessionsByDateRange(
      lastWeek.toDateString(),
      today.toDateString()
    );
  }

  // Update daily statistics
  async updateDailyStats(date) {
    if (!this.db) await this.init();

    const sessions = await this.getSessionsByDateRange(date, date);
    
    const workSessions = sessions.filter(s => s.type === 'work');
    const totalWorkTime = workSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalSessions = workSessions.length;
    const totalTasks = workSessions.reduce((sum, s) => sum + (s.tasksCompleted || 0), 0);

    const dailyStats = {
      date,
      totalWorkTime, // in seconds
      totalSessions,
      totalTasks,
      averageSessionLength: totalSessions > 0 ? totalWorkTime / totalSessions : 0,
      lastUpdated: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['dailyStats'], 'readwrite');
      const store = transaction.objectStore('dailyStats');

      const request = store.put(dailyStats);

      request.onsuccess = () => {
        resolve(dailyStats);
      };

      request.onerror = () => {
        reject(new Error('Failed to update daily stats'));
      };
    });
  }

  // Get daily stats for last 7 days
  async getWeeklyStats() {
    if (!this.db) await this.init();

    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toDateString());
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['dailyStats'], 'readonly');
      const store = transaction.objectStore('dailyStats');

      const promises = dates.map(date => {
        return new Promise((res) => {
          const request = store.get(date);
          request.onsuccess = () => {
            res(request.result || {
              date,
              totalWorkTime: 0,
              totalSessions: 0,
              totalTasks: 0,
              averageSessionLength: 0
            });
          };
          request.onerror = () => {
            res({
              date,
              totalWorkTime: 0,
              totalSessions: 0,
              totalTasks: 0,
              averageSessionLength: 0
            });
          };
        });
      });

      Promise.all(promises).then(resolve).catch(reject);
    });
  }

  // Clear all data (for testing)
  async clearAllData() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sessions', 'dailyStats'], 'readwrite');
      
      const sessionsStore = transaction.objectStore('sessions');
      const dailyStatsStore = transaction.objectStore('dailyStats');

      const clearSessions = sessionsStore.clear();
      const clearStats = dailyStatsStore.clear();

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(new Error('Failed to clear data'));
      };
    });
  }
}

// Create singleton instance
const database = new IrmodoroDatabase();

export { database };
export default database;