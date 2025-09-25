// User Tracking Utilities
import { db } from '../firebase/config.js';
import { doc, setDoc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

// Benzersiz kullanıcı ID'si oluştur
export function generateUserID() {
  let userID = localStorage.getItem('irmodoro_user_id');
  
  if (!userID) {
    // Benzersiz ID oluştur: timestamp + random string
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    userID = `user_${timestamp}_${randomStr}`;
    
    localStorage.setItem('irmodoro_user_id', userID);
    console.log('Yeni kullanıcı ID oluşturuldu:', userID);
  }
  
  return userID;
}

// Kullanıcı ID'sini al
export function getUserID() {
  return generateUserID();
}

// Kullanıcı profilini Firebase'e kaydet/güncelle
export async function saveUserProfile(userID, profileData = {}) {
  try {
    const userRef = doc(db, 'users', userID);
    const userDoc = await getDoc(userRef);
    
    const defaultProfile = {
      userID: userID,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      totalFocusTime: 0,
      totalSessions: 0,
      deviceInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform
      }
    };
    
    if (!userDoc.exists()) {
      // Yeni kullanıcı profili oluştur
      await setDoc(userRef, { ...defaultProfile, ...profileData });
      console.log('Yeni kullanıcı profili oluşturuldu:', userID);
    } else {
      // Mevcut profili güncelle
      await updateDoc(userRef, {
        lastActive: serverTimestamp(),
        ...profileData
      });
    }
    
    return true;
  } catch (error) {
    console.error('Kullanıcı profili kaydedilemedi:', error);
    return false;
  }
}

// Odaklanma süresini kaydet
export async function saveFocusSession(userID, focusTimeMinutes, sessionType = 'work') {
  try {
    const userRef = doc(db, 'users', userID);
    const sessionRef = doc(db, 'sessions', `${userID}_${Date.now()}`);
    
    // Session detaylarını kaydet
    const sessionData = {
      userID: userID,
      focusTime: focusTimeMinutes,
      sessionType: sessionType,
      timestamp: serverTimestamp(),
      url: window.location.href,
      date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    };
    
    await setDoc(sessionRef, sessionData);
    
    // Kullanıcı toplam istatistiklerini güncelle
    await updateDoc(userRef, {
      totalFocusTime: increment(focusTimeMinutes),
      totalSessions: increment(1),
      lastActive: serverTimestamp()
    });
    
    console.log(`Odaklanma süresi kaydedildi: ${focusTimeMinutes} dakika`);
    return true;
  } catch (error) {
    console.error('Odaklanma süresi kaydedilemedi:', error);
    return false;
  }
}

// Kullanıcı istatistiklerini getir
export async function getUserStats(userID) {
  try {
    const userRef = doc(db, 'users', userID);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      console.log('Kullanıcı bulunamadı');
      return null;
    }
  } catch (error) {
    console.error('Kullanıcı istatistikleri alınamadı:', error);
    return null;
  }
}

// Sayfa görünürlük durumunu takip et
export class FocusTracker {
  constructor(userID) {
    this.userID = userID;
    this.startTime = Date.now();
    this.totalFocusTime = 0;
    this.isActive = false; // Başlangıçta pasif
    this.lastSaveTime = Date.now();
    this.sessionActive = false;
    
    this.initializeTracking();
  }
  
  // Yeni oturum başlat
  startSession() {
    this.sessionActive = true;
    this.startTime = Date.now();
    this.totalFocusTime = 0;
    this.isActive = true;
    console.log('Odaklanma oturumu başlatıldı');
  }
  
  // Oturumu sonlandır ve kaydet
  async endSession() {
    if (this.sessionActive) {
      this.sessionActive = false;
      this.isActive = false;
      
      const focusMinutes = this.getCurrentFocusTime();
      if (focusMinutes > 0) {
        await saveFocusSession(this.userID, focusMinutes);
        console.log(`Oturum sonlandırıldı: ${focusMinutes} dakika`);
      }
      
      // Süreleri sıfırla
      this.totalFocusTime = 0;
      this.startTime = Date.now();
    }
  }
  
  initializeTracking() {
    // Sayfa görünürlük değişikliklerini takip et
    document.addEventListener('visibilitychange', () => {
      if (this.sessionActive) {
        if (document.hidden) {
          this.pauseTracking();
        } else {
          this.resumeTracking();
        }
      }
    });
    
    // Pencere odak değişikliklerini takip et
    window.addEventListener('blur', () => {
      if (this.sessionActive) this.pauseTracking();
    });
    window.addEventListener('focus', () => {
      if (this.sessionActive) this.resumeTracking();
    });
    
    // Sayfa kapatılırken son verileri kaydet
    window.addEventListener('beforeunload', () => {
      if (this.sessionActive) {
        this.saveCurrentSession();
      }
    });
    
    // Periyodik kaydetme (her 30 saniyede bir)
    this.saveInterval = setInterval(() => {
      if (this.sessionActive) {
        this.saveCurrentSession();
      }
    }, 30000);
  }
  
  pauseTracking() {
    if (this.isActive) {
      this.totalFocusTime += Date.now() - this.startTime;
      this.isActive = false;
      console.log('Odaklanma takibi duraklatıldı');
    }
  }
  
  resumeTracking() {
    if (!this.isActive && this.sessionActive) {
      this.startTime = Date.now();
      this.isActive = true;
      console.log('Odaklanma takibi devam ediyor');
    }
  }
  
  getCurrentFocusTime() {
    let currentTime = this.totalFocusTime;
    if (this.isActive) {
      currentTime += Date.now() - this.startTime;
    }
    return Math.round(currentTime / 1000 / 60); // Dakika cinsinden
  }
  
  async saveCurrentSession() {
    const focusMinutes = this.getCurrentFocusTime();
    
    // Sadece anlamlı süreleri kaydet (en az 1 dakika)
    if (focusMinutes >= 1) {
      await saveFocusSession(this.userID, focusMinutes);
      
      // Kaydedilen süreyi sıfırla
      this.totalFocusTime = 0;
      this.startTime = Date.now();
      this.lastSaveTime = Date.now();
    }
  }
  
  destroy() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    if (this.sessionActive) {
      this.saveCurrentSession();
    }
  }
}