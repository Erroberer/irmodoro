import React from 'react';
import './MaintenancePage.css';

const MaintenancePage = () => {
  return (
    <div className="maintenance-container">
      <div className="maintenance-content">
        {/* Animated gear icons */}
        <div className="gears-container">
          <div className="gear gear-1">
            <svg viewBox="0 0 100 100" className="gear-svg">
              <path d="M50,10 L60,20 L70,10 L80,20 L90,30 L80,40 L90,50 L80,60 L90,70 L80,80 L70,90 L60,80 L50,90 L40,80 L30,90 L20,80 L10,70 L20,60 L10,50 L20,40 L10,30 L20,20 L30,10 L40,20 Z" 
                    fill="currentColor" />
              <circle cx="50" cy="50" r="15" fill="transparent" stroke="currentColor" strokeWidth="3"/>
            </svg>
          </div>
          <div className="gear gear-2">
            <svg viewBox="0 0 100 100" className="gear-svg">
              <path d="M50,15 L58,22 L66,15 L74,22 L82,30 L74,38 L82,46 L74,54 L82,62 L74,70 L66,85 L58,78 L50,85 L42,78 L34,85 L26,70 L18,62 L26,54 L18,46 L26,38 L18,30 L26,22 L34,15 L42,22 Z" 
                    fill="currentColor" />
              <circle cx="50" cy="50" r="12" fill="transparent" stroke="currentColor" strokeWidth="3"/>
            </svg>
          </div>
          <div className="gear gear-3">
            <svg viewBox="0 0 100 100" className="gear-svg">
              <path d="M50,8 L62,18 L74,8 L86,18 L92,32 L86,42 L92,54 L86,64 L92,76 L86,86 L74,92 L62,86 L50,92 L38,86 L26,92 L14,86 L8,76 L14,64 L8,54 L14,42 L8,32 L14,18 L26,8 L38,18 Z" 
                    fill="currentColor" />
              <circle cx="50" cy="50" r="18" fill="transparent" stroke="currentColor" strokeWidth="3"/>
            </svg>
          </div>
        </div>

        {/* Main message */}
        <div className="maintenance-message">
          <h1 className="maintenance-title">
            Site Şuan Tamir Aşamasındadır
          </h1>
          <div className="maintenance-subtitle">
            <span className="typing-text">Daha iyi bir deneyim için çalışıyoruz...</span>
          </div>
        </div>

        {/* Animated progress bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <div className="progress-text">Güncelleme yapılıyor</div>
        </div>

        {/* Floating particles */}
        <div className="particles">
          {[...Array(12)].map((_, i) => (
            <div key={i} className={`particle particle-${i + 1}`}></div>
          ))}
        </div>

        {/* Bottom message */}
        <div className="maintenance-footer">
          <p>Kısa süre içinde geri döneceğiz!</p>
          <div className="heart-beat">💜</div>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;