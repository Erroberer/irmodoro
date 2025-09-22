// İRMODORO Service Worker
const CACHE_NAME = 'irmodoro-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/App.css',
  '/src/index.css',
  '/clock-icon.svg'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Background sync for session tracking
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-session') {
    event.waitUntil(syncSessionData());
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'START_SESSION_TRACKING':
      startSessionTracking(data);
      break;
    case 'END_SESSION_TRACKING':
      endSessionTracking(data);
      break;
    case 'UPDATE_SESSION_TIME':
      updateSessionTime(data);
      break;
    case 'SCHEDULE_NOTIFICATION':
      scheduleNotification(data);
      break;
    default:
      break;
  }
});

// Session tracking variables
let currentSession = null;
let sessionInterval = null;

// Start tracking a session
function startSessionTracking(sessionData) {
  currentSession = {
    id: Date.now(),
    type: sessionData.type, // 'work' or 'rest'
    startTime: Date.now(),
    duration: sessionData.duration * 1000, // convert to milliseconds
    endTime: null,
    isActive: true
  };

  // Send confirmation back to main thread
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SESSION_STARTED',
        sessionId: currentSession.id
      });
    });
  });

  // Set up interval to track time
  sessionInterval = setInterval(() => {
    if (currentSession && currentSession.isActive) {
      const elapsed = Date.now() - currentSession.startTime;
      
      // Send time update to main thread
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SESSION_TIME_UPDATE',
            sessionId: currentSession.id,
            elapsed: elapsed,
            remaining: currentSession.duration - elapsed
          });
        });
      });

      // Check if session is complete
      if (elapsed >= currentSession.duration) {
        endSessionTracking({ completed: true });
      }
    }
  }, 1000);
}

// End session tracking
function endSessionTracking(data) {
  if (currentSession) {
    currentSession.endTime = Date.now();
    currentSession.isActive = false;
    currentSession.completed = data.completed || false;

    // Clear interval
    if (sessionInterval) {
      clearInterval(sessionInterval);
      sessionInterval = null;
    }

    // Store session data
    storeSessionData(currentSession);

    // Send completion notification to main thread
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SESSION_ENDED',
          session: currentSession
        });
      });
    });

    // Show notification if session completed
    if (currentSession.completed) {
      showSessionCompleteNotification(currentSession);
    }

    currentSession = null;
  }
}

// Store session data in IndexedDB
function storeSessionData(session) {
  // This will be handled by the main thread through messaging
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'STORE_SESSION_DATA',
        session: {
          startTime: session.startTime,
          endTime: session.endTime,
          duration: Math.floor((session.endTime - session.startTime) / 1000), // in seconds
          type: session.type,
          completed: session.completed
        }
      });
    });
  });
}

// Show notification when session completes
function showSessionCompleteNotification(session) {
  const title = session.type === 'work' ? 'Çalışma Tamamlandı!' : 'Mola Tamamlandı!';
  const body = session.type === 'work' 
    ? 'Harika! Şimdi mola zamanı. Biraz dinlen.' 
    : 'Mola bitti! Çalışmaya geri dön.';

  const options = {
    body: body,
    icon: '/clock-icon.svg',
    badge: '/clock-icon.svg',
    tag: 'session-complete',
    requireInteraction: true,
    actions: [
      {
        action: 'start-next',
        title: session.type === 'work' ? 'Molaya Başla' : 'Çalışmaya Başla'
      },
      {
        action: 'dismiss',
        title: 'Tamam'
      }
    ]
  };

  self.registration.showNotification(title, options);
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'start-next') {
    // Send message to main thread to start next session
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'START_NEXT_SESSION'
        });
      });
    });
  }

  // Focus the app window
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

// Schedule notification
function scheduleNotification(data) {
  setTimeout(() => {
    const options = {
      body: data.body,
      icon: '/clock-icon.svg',
      badge: '/clock-icon.svg',
      tag: data.tag || 'scheduled-notification'
    };

    self.registration.showNotification(data.title, options);
  }, data.delay);
}

// Sync session data when online
async function syncSessionData() {
  // This would sync with a server if we had one
  // For now, just ensure data is properly stored locally
  console.log('Syncing session data...');
}