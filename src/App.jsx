import { useState, useEffect } from 'react'
import './App.css'

function App() {
  // Bip sesi fonksiyonu
  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz frekans
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Ses seviyesi
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2); // 0.2 saniye süre
    } catch (error) {
      console.log('Audio context not supported:', error);
    }
  };

  // Load settings from localStorage or use defaults
  const loadSettings = () => {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    return {
      workTime: 25,
      restTime: 5,
      totalSets: 4,
      isDarkMode: false
    };
  };

  const settings = loadSettings();

  // Timer states
  const [timeLeft, setTimeLeft] = useState(settings.workTime * 60) // minutes in seconds
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  
  // Settings states
  const [workTime, setWorkTime] = useState(settings.workTime) // minutes
  const [restTime, setRestTime] = useState(settings.restTime) // minutes
  const [isWorkSession, setIsWorkSession] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  
  // Temporary settings for modal
  const [tempWorkTime, setTempWorkTime] = useState(settings.workTime)
  const [tempRestTime, setTempRestTime] = useState(settings.restTime)
  const [tempTotalSets, setTempTotalSets] = useState(settings.totalSets)
  const [workTimeInSeconds, setWorkTimeInSeconds] = useState(false)
  const [restTimeInSeconds, setRestTimeInSeconds] = useState(false)
  
  // Sets states
  const [currentSet, setCurrentSet] = useState(1)
  const [totalSets, setTotalSets] = useState(settings.totalSets)
  const [completedSets, setCompletedSets] = useState(0)
  
  // Todo states
  const [todos, setTodos] = useState([
    { id: 1, text: 'Write prompt for AI', completed: false },
    { id: 2, text: 'Prepare coffee', completed: false }
  ])
  const [newTodo, setNewTodo] = useState('')
  
  // Real-time clock
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Theme state - now supports 3 themes: light, dark, irem
  const [theme, setTheme] = useState(settings.theme || 'light')
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  
  // Backward compatibility
  const isDarkMode = theme === 'dark'
  
  // Mode state (work/rest)
  const [mode, setMode] = useState('work')
  
  // Load tasks from localStorage
  const loadTasks = () => {
    const savedTasks = localStorage.getItem('pomodoroTasks');
    let tasks = [];
    
    if (savedTasks) {
      tasks = JSON.parse(savedTasks);
    } else {
      tasks = [];
    }
    
    // Only add "fatihi aramak" task if current theme is "irem"
    if (theme === 'irem') {
      const fatiTask = tasks.find(task => task.text === 'fatihi aramak');
      if (!fatiTask) {
        tasks.unshift({ text: 'fatihi aramak', completed: false });
      } else {
        // Reset completion status if it exists
        fatiTask.completed = false;
      }
    } else {
      // Remove "fatihi aramak" task if theme is not "irem"
      tasks = tasks.filter(task => task.text !== 'fatihi aramak');
    }
    
    return tasks;
  };

  // Tasks state (replacing todos for new structure)
  const [tasks, setTasks] = useState(loadTasks())
  const [editingTaskIndex, setEditingTaskIndex] = useState(null)

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
  }, [tasks]);

  // Reload tasks when theme changes
  useEffect(() => {
    setTasks(loadTasks());
  }, [theme]);
  
  // Progress ring calculations
  const circumference = 2 * Math.PI * 130 // radius = 130
  const progress = ((isWorkSession ? workTime * 60 : restTime * 60) - timeLeft) / (isWorkSession ? workTime * 60 : restTime * 60)
  const strokeDashoffset = circumference - (progress * circumference)

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (isRunning && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Session completed
      if (isWorkSession) {
        // Work session completed
        if (currentSet < totalSets) {
          // Switch to rest break
          playBeep(); // Bip sesi çal - work'ten rest'e geçiş
          setIsWorkSession(false);
          setTimeLeft(restTime * (restTimeInSeconds ? 1 : 60));
          // Don't increment currentSet yet - we're in break between sets
        } else {
          // All sets completed
          playBeep(); // Bip sesi çal - tüm setler tamamlandı
          setIsRunning(false);
          setCurrentSet(1);
          setCompletedSets(0);
          setIsWorkSession(true);
          setTimeLeft(workTime * (workTimeInSeconds ? 1 : 60));
        }
      } else {
        // Rest break completed, move to next work set
        playBeep(); // Bip sesi çal - rest'ten work'e geçiş
        setIsWorkSession(true);
        setCurrentSet(prev => prev + 1);
        setCompletedSets(prev => prev + 1);
        setTimeLeft(workTime * (workTimeInSeconds ? 1 : 60));
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused, timeLeft, isWorkSession, workTime, restTime, currentSet, totalSets, workTimeInSeconds, restTimeInSeconds]);

  // Real-time clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format real-time clock
  const formatClock = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  // Calculate progress percentage
  const getProgress = () => {
    const totalTime = isWorkSession ? workTime * 60 : restTime * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  // Timer controls
  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handleStop = () => {
    setIsPaused(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(isWorkSession ? workTime * 60 : restTime * 60);
  };

  // Settings
  const handleSettingsSubmit = (e) => {
    e.preventDefault();
    setTimeLeft(isWorkSession ? workTime * 60 : restTime * 60);
    setShowSettings(false);
  };

  // Todo functions
  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, { id: Date.now(), text: newTodo, completed: false }]);
      setNewTodo('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // Theme functions
  const toggleThemeMenu = () => {
    setShowThemeMenu(!showThemeMenu);
  };

  const selectTheme = (selectedTheme) => {
    setTheme(selectedTheme);
    setShowThemeMenu(false);
    
    // Save theme preference to localStorage
    const currentSettings = JSON.parse(localStorage.getItem('pomodoroSettings') || '{}');
    const updatedSettings = {
      ...currentSettings,
      workTime: workTime,
      restTime: restTime,
      totalSets: totalSets,
      theme: selectedTheme,
      isDarkMode: selectedTheme === 'dark' // backward compatibility
    };
    localStorage.setItem('pomodoroSettings', JSON.stringify(updatedSettings));
  };

  // Legacy theme toggle for backward compatibility
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    selectTheme(newTheme);
  };

  // Mode switching with instant teleportation
  const handleModeChange = (newMode) => {
    setMode(newMode);
    const newIsWorkSession = newMode === 'work';
    setIsWorkSession(newIsWorkSession);
    
    // Set time based on current session type
    if (newIsWorkSession) {
      setTimeLeft(workTime * (workTimeInSeconds ? 1 : 60));
    } else {
      setTimeLeft(restTime * (restTimeInSeconds ? 1 : 60));
    }
    
    // Don't reset running state - allow instant switching during active timer
  };

  // Timer controls for new structure
  const startTimer = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    setIsPaused(true);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentSet(1);
    setCompletedSets(0);
    setIsWorkSession(true);
    setTimeLeft(workTime * (workTimeInSeconds ? 1 : 60));
  };

  const toggleTimer = () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  // Settings modal functions
  const openSettings = () => {
    setTempWorkTime(workTime);
    setTempRestTime(restTime);
    setTempTotalSets(totalSets);
    setShowSettings(true);
  };

  const closeSettings = () => {
    setShowSettings(false);
  };

  const applySettings = () => {
    setWorkTime(tempWorkTime);
    setRestTime(tempRestTime);
    setTotalSets(tempTotalSets);
    
    // Save settings to localStorage
    const settingsToSave = {
      workTime: tempWorkTime,
      restTime: tempRestTime,
      totalSets: tempTotalSets,
      isDarkMode: isDarkMode
    };
    localStorage.setItem('pomodoroSettings', JSON.stringify(settingsToSave));
    
    // Reset timer with new values
    if (isWorkSession) {
      setTimeLeft(tempWorkTime * (workTimeInSeconds ? 1 : 60));
    } else {
      setTimeLeft(tempRestTime * (restTimeInSeconds ? 1 : 60));
    }
    
    setShowSettings(false);
  };

  const handleWorkTimeChange = (value) => {
    // Check if value ends with 's' for seconds
    const isSeconds = value.toString().toLowerCase().endsWith('s');
    const numericValue = parseInt(value.replace(/s$/i, '')) || 0;
    
    setWorkTimeInSeconds(isSeconds);
    setTempWorkTime(numericValue);
  };

  const handleRestTimeChange = (value) => {
    // Check if value ends with 's' for seconds
    const isSeconds = value.toString().toLowerCase().endsWith('s');
    const numericValue = parseInt(value.replace(/s$/i, '')) || 0;
    
    setRestTimeInSeconds(isSeconds);
    setTempRestTime(numericValue);
  };

  // Task management functions
  const addTask = () => {
    if (tasks.length < 4) {
      const newTaskIndex = tasks.length;
      setTasks([...tasks, { text: '', completed: false }]);
      // Automatically focus on the new task input
      setTimeout(() => {
        setEditingTaskIndex(newTaskIndex);
      }, 100);
    }
  };

  const updateTask = (index, newText) => {
    const updatedTasks = [...tasks];
    updatedTasks[index].text = newText;
    setTasks(updatedTasks);
  };

  const toggleTask = (index) => {
    const updatedTasks = [...tasks];
    updatedTasks[index].completed = !updatedTasks[index].completed;
    setTasks(updatedTasks);
  };

  const deleteTask = (index) => {
    const taskToDelete = tasks[index];
    
    // Prevent deletion of "fatihi aramak" task only in irem theme
    if (taskToDelete && taskToDelete.text === 'fatihi aramak' && theme === 'irem') {
      return; // Don't delete this task in irem theme
    }
    
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);
    // Reset editing state if we're deleting the task being edited
    if (editingTaskIndex === index) {
      setEditingTaskIndex(null);
    } else if (editingTaskIndex > index) {
      setEditingTaskIndex(editingTaskIndex - 1);
    }
  };

  const startEditingTask = (index) => {
    setEditingTaskIndex(index);
  };

  const finishEditingTask = () => {
    setEditingTaskIndex(null);
  };

  return (
    <div className={`app ${theme}`}>
      {/* Fixed top center sets indicator */}
      <div className="sets-indicator-fixed">
        <div className="sets-breaks-container">
          {Array.from({ length: totalSets }, (_, index) => {
            const setNum = index + 1;
            return (
              <div key={setNum} className="set-break-group">
                <div 
                  className={`set-box ${
                    currentSet === setNum && isWorkSession ? 'active' : ''
                  } ${
                    currentSet > setNum || (currentSet === setNum && !isWorkSession) ? 'completed' : ''
                  }`}
                >
                  {setNum}
                </div>
                {setNum < totalSets && (
                  <div 
                    className={`break-box ${
                      currentSet === setNum && !isWorkSession ? 'active' : ''
                    } ${
                      currentSet > setNum ? 'completed' : ''
                    }`}
                  >
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Full width header */}
      <header className="app-header">
        <div className="clock">
          <span className="clock-pill">{formatClock(currentTime)}</span>
        </div>
      </header>

      {/* Main content area - three column layout */}
      <main className="main-content">
        <div className="pomodoro-container">
          <div className="left-sidebar">
            <div className="mode-buttons">
              <button 
                className={`mode-btn ${mode === 'work' ? 'active' : ''}`}
                onClick={() => handleModeChange('work')}
              >
                Work ({workTime}{workTimeInSeconds ? 's' : 'm'})
              </button>
              <button 
                className={`mode-btn ${mode === 'rest' ? 'active' : ''}`}
                onClick={() => handleModeChange('rest')}
              >
                {theme === 'irem' ? 'Fatihe yazmaya kalan vakit' : `Rest (${restTime}${restTimeInSeconds ? 's' : 'm'})`}
              </button>
            </div>
          </div>

          <div className="timer-section">
            <div className="timer-display">
              <div className="circular-progress">
                <svg className="progress-ring" width="400" height="400">
                  <circle
                    className="progress-ring-background"
                    stroke="#2a2a2a"
                    strokeWidth="24"
                    fill="transparent"
                    r="180"
                    cx="200"
                    cy="200"
                  />
                  <circle
                    className="progress-ring-progress"
                    strokeWidth="24"
                    fill="transparent"
                    r="180"
                    cx="200"
                    cy="200"
                    strokeDasharray={`${2 * Math.PI * 180}`}
                    strokeDashoffset={`${2 * Math.PI * 180 * (1 - (timeLeft / (isWorkSession ? (workTime * (workTimeInSeconds ? 1 : 60)) : (restTime * (restTimeInSeconds ? 1 : 60)))))}`}
                    strokeLinecap="round"
                    transform="rotate(-90 200 200)"
                  />
                </svg>
                <div className="timer-content">
                  <div className="time">{formatTime(timeLeft)}</div>
                  <div className="timer-label">Pomodoro Timer</div>
                </div>
              </div>
            </div>
          </div>

          <div className="right-sidebar">
            <div className="timer-controls">
              <button 
                className="control-btn start-btn" 
                onClick={isRunning ? pauseTimer : startTimer}
              >
                {isRunning ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                )}
              </button>
              <button className="control-btn reset-btn" onClick={resetTimer}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1,4 1,10 7,10"/>
                  <path d="M3.51,15a9,9 0 1,0 2.13-9.36L1,10"/>
                </svg>
              </button>
              <button className="control-btn settings-btn" onClick={openSettings}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12,1 L12,3 M12,21 L12,23 M4.22,4.22 L5.64,5.64 M18.36,18.36 L19.78,19.78 M1,12 L3,12 M21,12 L23,12 M4.22,19.78 L5.64,18.36 M18.36,5.64 L19.78,4.22"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="tasks-section">
          <div className="tasks-header">
            <button className="add-task-btn" onClick={addTask}>+ Add Task</button>
          </div>
          <div className="tasks-list">
            {tasks.map((task, index) => (
              <div key={index} className="task-item">
                <span className="task-number">Task {index + 1}</span>
                {editingTaskIndex === index ? (
                  <input
                    type="text"
                    className="task-input editing"
                    value={task.text}
                    onChange={(e) => updateTask(index, e.target.value)}
                    onBlur={finishEditingTask}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        finishEditingTask();
                      }
                    }}
                    placeholder="Enter task..."
                    autoFocus
                  />
                ) : (
                  <span 
                    className={`task-text ${task.completed ? 'completed' : ''} ${task.text === '' ? 'empty' : ''}`}
                    onClick={() => startEditingTask(index)}
                  >
                    {task.text || 'Click to add task...'}
                  </span>
                )}
                <button 
                  className={`task-complete-btn ${task.completed ? 'completed' : ''}`}
                  onClick={() => toggleTask(index)}
                >
                  {task.completed ? '✓' : '○'}
                </button>
                <button 
                  className="task-delete-btn"
                  onClick={() => deleteTask(index)}
                >
                  ×
                </button>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="no-tasks">
                No tasks yet. Add one to get started!
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Theme toggle - bottom right corner */}
      <button className="theme-toggle" onClick={toggleThemeMenu}>
        {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💜'}
      </button>

      {/* Theme selection menu */}
      {showThemeMenu && (
        <div className="theme-menu">
          <button 
            className={`theme-option ${theme === 'light' ? 'active' : ''}`}
            onClick={() => selectTheme('light')}
          >
            <span className="theme-icon">☀️</span>
            <span className="theme-name">Light</span>
          </button>
          <button 
            className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => selectTheme('dark')}
          >
            <span className="theme-icon">🌙</span>
            <span className="theme-name">Dark</span>
          </button>
          <button 
            className={`theme-option ${theme === 'irem' ? 'active' : ''}`}
            onClick={() => selectTheme('irem')}
          >
            <span className="theme-icon">💜</span>
            <span className="theme-name">İrem</span>
          </button>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-backdrop" onClick={closeSettings}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Settings</h2>
            
            <div className="settings-group">
              <label>Working Time:</label>
              <input
                type="text"
                value={tempWorkTime + (workTimeInSeconds ? 's' : '')}
                onChange={(e) => handleWorkTimeChange(e.target.value)}
                placeholder="25 or 30s"
              />
              <span className="time-unit">{workTimeInSeconds ? 'seconds' : 'minutes'}</span>
            </div>

            <div className="settings-group">
              <label>Resting Time:</label>
              <input
                type="text"
                value={tempRestTime + (restTimeInSeconds ? 's' : '')}
                onChange={(e) => handleRestTimeChange(e.target.value)}
                placeholder="5 or 30s"
              />
              <span className="time-unit">{restTimeInSeconds ? 'seconds' : 'minutes'}</span>
            </div>

            <div className="settings-group">
              <label>Sets:</label>
              <input
                type="number"
                value={tempTotalSets}
                onChange={(e) => setTempTotalSets(parseInt(e.target.value) || 1)}
                min="1"
                max="10"
                placeholder="4"
              />
            </div>

            <div className="modal-buttons">
              <button className="modal-btn cancel-btn" onClick={closeSettings}>
                Cancel
              </button>
              <button className="modal-btn apply-btn" onClick={applySettings}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App
