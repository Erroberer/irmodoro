import { useState, useEffect } from 'react'
import { getUserStats } from '../utils/userTracking'

const UserStats = ({ userID, theme }) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadStats = async () => {
      if (!userID) return
      
      try {
        setLoading(true)
        const userStats = await getUserStats(userID)
        setStats(userStats)
        setError(null)
      } catch (err) {
        console.error('Kullanıcı istatistikleri yüklenirken hata:', err)
        setError('İstatistikler yüklenemedi')
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [userID])

  const formatTime = (minutes) => {
    if (!minutes) return '0 dk'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}s ${mins}dk`
    }
    return `${mins}dk`
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleDateString('tr-TR')
  }

  if (loading) {
    return (
      <div className={`user-stats ${theme}`}>
        <div className="stats-loading">
          <div className="loading-spinner"></div>
          <p>İstatistikler yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`user-stats ${theme}`}>
        <div className="stats-error">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className={`user-stats ${theme}`}>
        <div className="stats-empty">
          <p>Henüz istatistik bulunmuyor</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`user-stats ${theme}`}>
      <div className="stats-header">
        <h3>Kullanıcı İstatistikleri</h3>
        <div className="user-id">
          <span>Kullanıcı ID: </span>
          <code>{userID}</code>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Toplam Odaklanma Süresi</div>
          <div className="stat-value">{formatTime(stats.totalFocusTime)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Toplam Oturum Sayısı</div>
          <div className="stat-value">{stats.totalSessions}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Ortalama Oturum Süresi</div>
          <div className="stat-value">{formatTime(stats.averageSessionTime)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">İlk Kullanım</div>
          <div className="stat-value">{formatDate(stats.firstSession)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Son Kullanım</div>
          <div className="stat-value">{formatDate(stats.lastSession)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Bu Hafta</div>
          <div className="stat-value">{formatTime(stats.thisWeekTime)}</div>
        </div>
      </div>

      {stats.recentSessions && stats.recentSessions.length > 0 && (
        <div className="recent-sessions">
          <h4>Son Oturumlar</h4>
          <div className="sessions-list">
            {stats.recentSessions.map((session, index) => (
              <div key={index} className="session-item">
                <div className="session-date">
                  {formatDate(session.timestamp)}
                </div>
                <div className="session-duration">
                  {formatTime(session.duration)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default UserStats