import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLearningHistory } from '../services/historyService';
import { useAuth } from '../context/AuthContext';

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await getLearningHistory(user.id);

      if (error) {
        console.error('Failed to load learning history:', error);
      } else {
        setHistory(data || []);
      }

      setLoading(false);
    };

    loadHistory();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="glass-card">
          <p>Loading your learning history...</p>
        </div>
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className="page-container">
        <div className="glass-card empty-state">
          <h3>Your Learning History</h3>
          <p>No lessons yet. Generate your first lesson on the Home page to start building your history.</p>
          <button type="button" className="btn btn--primary" onClick={() => navigate('/')}>
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const handleSelect = (lesson) => {
    navigate('/', { state: { lesson } });
  };

  return (
    <div className="page-container">
      <section className="history-page">
        <div className="history-header">
          <h1>Your Learning History</h1>
          <p>Continue learning from topics you've explored before.</p>
        </div>

        <div className="history-list">
          {history.map((lesson) => (
            <button
              key={lesson.id}
              type="button"
              className="history-item"
              onClick={() => handleSelect(lesson)}
            >
              <div>
                <h3>{lesson.title || lesson.prompt}</h3>
                <p>{lesson.prompt}</p>
                <span>
                  {lesson.learning_type || 'Learning lesson'}
                  {' • '}
                  {lesson.difficulty || 'Beginner'}
                </span>
              </div>
              <div className="history-arrow">→</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default History;
